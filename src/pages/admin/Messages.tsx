import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Eye, EyeOff, Calendar, Mail, User, FileText, ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isSeen: boolean;
  createdAt: string;
}

const AdminMessages = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
    }
  }, [isAdmin]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/contact-messages', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSeen = async (id: string, currentStatus: boolean) => {
    try {
      await apiRequest('PATCH', `/api/contact-messages/${id}/seen`, { isSeen: !currentStatus });

      setMessages(messages.map(m => 
        m.id === id ? { ...m, isSeen: !currentStatus } : m
      ));

      toast({
        title: "Updated",
        description: `Message marked as ${!currentStatus ? 'seen' : 'not seen'}`,
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await apiRequest('DELETE', `/api/contact-messages/${id}`, {});

      setMessages(messages.filter(m => m.id !== id));
      setSelectedMessage(null);

      toast({
        title: "Deleted",
        description: "Message deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadExcel = () => {
    if (messages.length === 0) {
      toast({
        title: "No Data",
        description: "No messages to download.",
        variant: "destructive",
      });
      return;
    }

    const excelData = messages.map((msg) => ({
      "Date": new Date(msg.createdAt).toLocaleDateString(),
      "Time": new Date(msg.createdAt).toLocaleTimeString(),
      "Full Name": msg.name,
      "Email": msg.email,
      "Subject": msg.subject,
      "Message": msg.message,
      "Status": msg.isSeen ? "Seen" : "New"
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 40 },
      { wch: 10 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Messages");
    XLSX.writeFile(workbook, "messages.xlsx");

    toast({
      title: "Success",
      description: `Downloaded Excel file with ${messages.length} messages.`,
    });
  };

  const downloadPDF = () => {
    if (messages.length === 0) {
      toast({
        title: "No Data",
        description: "No messages to download.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF("l", "mm", "a4", true);
    doc.setFillColor(22, 78, 59);
    doc.rect(0, 0, 297, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("GCMN Library - Messages Report", 148.5, 12, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 148.5, 17, { align: "center" });

    let y = 30;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const rowHeight = 8;
    const colWidths = [30, 35, 35, 40, 60, 25, 20];
    const columns = ["Date", "Name", "Email", "Subject", "Message", "Status", "Actions"];

    doc.setFillColor(200, 220, 200);
    doc.setTextColor(22, 78, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    let x = margin;
    columns.forEach((col, i) => {
      doc.text(col, x, y, { maxWidth: colWidths[i] - 2 });
      x += colWidths[i];
    });

    y += rowHeight;
    doc.setDrawColor(150, 150, 150);
    doc.line(margin, y - 2, 287 - margin, y - 2);

    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    messages.forEach((msg) => {
      if (y + rowHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
        doc.setFillColor(200, 220, 200);
        doc.setTextColor(22, 78, 59);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        x = margin;
        columns.forEach((col, i) => {
          doc.text(col, x, y, { maxWidth: colWidths[i] - 2 });
          x += colWidths[i];
        });
        y += rowHeight;
        doc.setDrawColor(150, 150, 150);
        doc.line(margin, y - 2, 287 - margin, y - 2);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
      }

      x = margin;
      const rowData = [
        new Date(msg.createdAt).toLocaleDateString(),
        msg.name,
        msg.email,
        msg.subject,
        msg.message.substring(0, 30) + (msg.message.length > 30 ? "..." : ""),
        msg.isSeen ? "Seen" : "New",
        "View"
      ];

      rowData.forEach((data, i) => {
        doc.text(data, x, y, { maxWidth: colWidths[i] - 2 });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    doc.save(`gcmn-messages-report-${new Date().getTime()}.pdf`);
    toast({
      title: "Success",
      description: `Downloaded PDF with ${messages.length} messages.`,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <motion.div 
      className="min-h-screen pt-20 pb-12"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
    >
      <div className="py-8 gradient-dark text-white">
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare />
            Messages / Queries
          </h1>
          <p className="text-white/80 mt-2">View and manage contact form submissions</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-semibold text-foreground">All Messages ({messages.length})</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadExcel} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Download Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadPDF} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto mb-4 text-muted-foreground/50" size={48} />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((message) => (
                        <TableRow 
                          key={message.id}
                          className={`cursor-pointer hover:bg-muted/50`}
                          onClick={() => setSelectedMessage(message)}
                          data-testid={`row-message-${message.id}`}
                        >
                          <TableCell className="font-medium">{message.name}</TableCell>
                          <TableCell className="text-sm">{message.email}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{message.subject}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{message.message}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(message.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSeen(message.id, message.isSeen)}
                                title={message.isSeen ? 'Mark as new' : 'Mark as seen'}
                                data-testid={`button-toggle-seen-${message.id}`}
                              >
                                {message.isSeen ? <EyeOff size={16} /> : <Eye size={16} />}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                    <Trash2 size={16} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the message from {message.name}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMessage(message.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              {selectedMessage ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={selectedMessage.id}
                >
                  <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                    <h3 className="font-semibold text-foreground">Message Details</h3>
                    {!selectedMessage.isSeen && (
                      <Button 
                        size="sm" 
                        onClick={() => toggleSeen(selectedMessage.id, selectedMessage.isSeen)}
                      >
                        <Eye size={14} className="mr-1" /> Mark as Seen
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <User size={14} /> Name
                      </div>
                      <p className="font-medium text-foreground">{selectedMessage.name}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail size={14} /> Email
                      </div>
                      <a href={`mailto:${selectedMessage.email}`} className="text-primary hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <FileText size={14} /> Subject
                      </div>
                      <p className="font-medium text-foreground">{selectedMessage.subject}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar size={14} /> Received
                      </div>
                      <p className="text-foreground">{formatDate(selectedMessage.createdAt)}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MessageSquare size={14} /> Message
                      </div>
                      <p className="text-foreground bg-muted/50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex gap-2">
                    <Button asChild className="flex-1">
                      <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                        <Mail size={14} className="mr-2" /> Reply
                      </a>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMessage(selectedMessage.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="mx-auto mb-4 text-muted-foreground/50" size={48} />
                  <p>Select a message to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminMessages;
