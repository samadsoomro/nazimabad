import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Book, Trash2, RefreshCw, Download, FileSpreadsheet, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BorrowRecord {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerEmail: string;
  borrowDate: string;
  returnDate: string | null;
  dueDate: string;
  status: string;
  libraryCardId: string;
  createdAt: string;
}

const BorrowedBooks = () => {
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBorrows = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/borrowed-books', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch borrows');
      const data = await res.json();
      setBorrows(data);
    } catch (error) {
      console.error('Error fetching borrows:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch borrow records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrows();
  }, []);

  const handleMarkReturned = async (id: string) => {
    if (!confirm('Are you sure you want to mark this book as returned?')) return;

    try {
      await apiRequest('PATCH', `/api/book-borrows/${id}/return`, {});

      toast({
        title: 'Success',
        description: 'Book marked as returned',
      });
      fetchBorrows();
    } catch (error) {
      console.error('Error updating borrow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update record',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;

    try {
      await apiRequest('DELETE', `/api/book-borrows/${id}`, {});
      toast({
        title: 'Deleted',
        description: 'Record deleted successfully',
      });
      fetchBorrows();
    } catch (error) {
      console.error('Error deleting borrow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete record',
        variant: 'destructive',
      });
    }
  };

  const downloadExcel = () => {
    if (borrows.length === 0) {
      toast({
        title: "No Data",
        description: "No borrow records to download.",
        variant: "destructive",
      });
      return;
    }

    const excelData = borrows.map((borrow, index) => ({
      "Serial No": index + 1,
      "Borrower Name": borrow.borrowerName,
      "Phone Number": borrow.borrowerPhone,
      "Email Address": borrow.borrowerEmail,
      "Book Name": borrow.bookTitle,
      "Borrow Date": format(new Date(borrow.borrowDate), 'MMM dd, yyyy'),
      "Return Date (auto)": format(new Date(borrow.dueDate), 'MMM dd, yyyy'),
      "Status": borrow.status.charAt(0).toUpperCase() + borrow.status.slice(1)
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Borrowed Books");
    XLSX.writeFile(workbook, "borrowed_books.xlsx");

    toast({
      title: "Success",
      description: `Downloaded Excel file with ${borrows.length} borrow records.`,
    });
  };

  const downloadPDF = () => {
    if (borrows.length === 0) {
      toast({
        title: "No Data",
        description: "No borrow records to download.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    doc.setFillColor(22, 78, 59);
    doc.rect(0, 0, 297, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GCMN Library - Book Borrow Report", 148.5, 12, { align: "center" });

    let y = 30;
    const columns = ["Serial No", "Borrower Name", "Phone Number", "Email Address", "Book Name", "Borrow Date", "Return Date (auto)"];
    const colWidths = [20, 45, 35, 55, 60, 35, 35];

    doc.setFillColor(200, 220, 200);
    doc.setTextColor(22, 78, 59);
    doc.setFontSize(10);

    let x = 10;
    columns.forEach((col, i) => {
      doc.text(col, x, y);
      x += colWidths[i];
    });

    y += 10;
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    borrows.forEach((borrow, index) => {
      if (y > 180) {
        doc.addPage();
        y = 20;
      }
      x = 10;
      const rowData = [
        (index + 1).toString(),
        borrow.borrowerName,
        borrow.borrowerPhone,
        borrow.borrowerEmail,
        borrow.bookTitle,
        format(new Date(borrow.borrowDate), 'MMM dd, yyyy'),
        format(new Date(borrow.dueDate), 'MMM dd, yyyy')
      ];

      rowData.forEach((data, i) => {
        doc.text(data || "-", x, y, { maxWidth: colWidths[i] - 5 });
        x += colWidths[i];
      });
      y += 10;
    });

    doc.save(`borrow-report-${new Date().getTime()}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen pt-20 pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="container">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Book className="text-primary" />
                Borrowed Books
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage all book borrowing records
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadExcel} className="gap-2">
                <FileSpreadsheet size={16} />
                Download Excel
              </Button>
              <Button variant="outline" onClick={downloadPDF} className="gap-2">
                <Download size={16} />
                Download PDF
              </Button>
              <Button variant="outline" onClick={fetchBorrows} className="gap-2">
                <RefreshCw size={16} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Clock className="text-amber-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {borrows.filter(b => b.status === 'borrowed').length}
                </p>
                <p className="text-sm text-muted-foreground">Currently Borrowed</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-500" size={24} />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {borrows.filter(b => b.status === 'returned').length}
                </p>
                <p className="text-sm text-muted-foreground">Returned</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Book className="text-primary" size={24} />
              <div>
                <p className="text-2xl font-bold text-foreground">{borrows.length}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </div>
          </div>
        </div>

        {borrows.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-lg border border-border">
            <Book size={64} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Borrow Records</h3>
            <p className="text-muted-foreground">
              Borrow records will appear here when students borrow books.
            </p>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial No</TableHead>
                      <TableHead>Borrower Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Email Address</TableHead>
                      <TableHead>Book Name</TableHead>
                      <TableHead>Borrow Date</TableHead>
                      <TableHead>Return Date (auto)</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {borrows.map((borrow, index) => (
                      <TableRow key={borrow.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {borrow.borrowerName}
                        </TableCell>
                        <TableCell>
                          {borrow.borrowerPhone || '-'}
                        </TableCell>
                        <TableCell>
                          {borrow.borrowerEmail || '-'}
                        </TableCell>
                        <TableCell>
                          {borrow.bookTitle}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(borrow.borrowDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(borrow.dueDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {borrow.status === 'borrowed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkReturned(borrow.id)}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                <CheckCircle size={14} className="mr-1" />
                                Return
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(borrow.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
};

export default BorrowedBooks;
