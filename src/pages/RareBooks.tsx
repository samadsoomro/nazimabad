import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Eye, Calendar, BookOpen, Shield, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const RareBooks: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Security restrictions for Rare Books
    const preventDefaults = (e: any) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Ctrl+S, Ctrl+P, Ctrl+Shift+I, Ctrl+U
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u' || e.key === 'i')) ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventDefaults);
    document.addEventListener('selectstart', preventDefaults);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', preventDefaults);
      document.removeEventListener('selectstart', preventDefaults);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    fetch('/api/rare-books')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching rare books:', err);
        setLoading(false);
      });
  }, []);

  const filteredBooks = (books || []).filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    book.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      className="min-h-screen pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="py-12 lg:py-16 gradient-dark text-white text-center">
        <div className="container">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 border-2 border-white rounded-full text-white font-semibold mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Archive size={18} />
            <span>Digital Archive</span>
          </motion.div>
          <motion.h1
            className="text-3xl lg:text-4xl font-bold mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Rare Books Collection
          </motion.h1>
          <motion.p
            className="text-lg text-white/90 max-w-2xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Explore our digital archive of rare and historical books with secure viewing technology
          </motion.p>
        </div>
      </div>

      {/* Content */}
      <div className="py-12 lg:py-16">
        <div className="container">
          {/* Security Notice */}
          <motion.div
            className="flex items-start gap-4 p-6 bg-primary/5 border-2 border-primary rounded-xl mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Shield size={24} className="text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Secure Viewing</h3>
              <p className="text-sm text-muted-foreground">
                These rare books are available for viewing only. Screenshots and downloads are restricted
                to preserve our valuable collection. Please handle with respect.
              </p>
            </div>
          </motion.div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Search rare books by title, author, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Books Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedBook(book)}
              >
                <div className="relative h-64 overflow-hidden bg-muted flex items-center justify-center">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <Archive size={48} className="text-muted-foreground/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white font-medium">
                      Archive Item
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{book.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{book.category}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Digital Copy</span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      View Only
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-16">
              <Archive size={48} className="mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold text-foreground mb-2">No Books Found</h4>
              <p className="text-muted-foreground">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Book Detail Modal */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBook(null)}
          >
            <motion.div
              className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64 bg-primary/10 flex items-center justify-center overflow-hidden">
                {selectedBook.coverImage ? (
                  <img src={selectedBook.coverImage} alt={selectedBook.title} className="w-full h-full object-cover" />
                ) : (
                  <Archive size={64} className="text-primary/20" />
                )}
                <button
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  onClick={() => setSelectedBook(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 lg:p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {selectedBook.category}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{selectedBook.title}</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">{selectedBook.description}</p>
                
                <div className="p-4 bg-secondary rounded-lg mb-6 text-center border-2 border-dashed border-primary/20 select-none">
                  <p className="text-sm text-muted-foreground">Digital Preview Mode</p>
                  <p className="text-xs text-muted-foreground italic">Protected content: Read-only access</p>
                </div>

                <div 
                  className="relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden border shadow-inner select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {selectedBook.id ? (
                    <div className="w-full h-full relative group/viewer">
                      <div className="flex flex-col h-full">
                        <embed
                          src={`/api/rare-books/stream/${selectedBook.id}#toolbar=0&navpanes=0&scrollbar=1`}
                          type="application/pdf"
                          className="w-full flex-1 border-0"
                          style={{ userSelect: 'none' }}
                        />
                        <div className="bg-muted p-2 text-center text-xs text-muted-foreground border-t">
                          View Only Mode • GCMN Library Archive
                        </div>
                      </div>
                      
                      {/* Security Watermark - Reduced opacity and made pointer-events-none to ensure scroll works */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-45 select-none">
                        <div className="text-4xl font-bold text-black whitespace-nowrap">
                          GCMN LIBRARY ARCHIVE • PROTECTED CONTENT
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Archive size={48} className="mb-2 opacity-20" />
                      <p>Preview not available</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RareBooks;
