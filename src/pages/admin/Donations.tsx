import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Heart, RefreshCw, DollarSign, Download, FileSpreadsheet } from "lucide-react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

interface Donation {
  id: string;
  amount: string;
  method: string;
  name: string | null;
  email: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

const Donations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDonations = async () => {
    try {
      const res = await fetch('/api/donations', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch donations');
      const data = await res.json();
      setDonations(data || []);
    } catch (error: any) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch donations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const deleteDonation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this donation record?")) return;

    try {
      await apiRequest('DELETE', `/api/donations/${id}`, {});
      setDonations(donations.filter(d => d.id !== id));
      toast({
        title: "Deleted",
        description: "Donation record has been deleted.",
      });
    } catch (error: any) {
      console.error("Error deleting donation:", error);
      toast({
        title: "Error",
        description: "Failed to delete donation.",
        variant: "destructive",
      });
    }
  };

  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  const downloadExcel = () => {
    if (donations.length === 0) {
      toast({
        title: "No Data",
        description: "No donations to download.",
        variant: "destructive",
      });
      return;
    }

    const excelData = donations.map((donation) => ({
      "Amount (PKR)": Number(donation.amount),
      "Method": donation.method,
      "Name": donation.name || "Anonymous",
      "Email": donation.email || "-",
      "Message": donation.message || "-",
      "Date": new Date(donation.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 35 },
      { wch: 15 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
    XLSX.writeFile(workbook, "donations.xlsx");

    toast({
      title: "Success",
      description: `Downloaded Excel file with ${donations.length} donations.`,
    });
  };

  const downloadPDF = () => {
    if (donations.length === 0) {
      toast({
        title: "No Data",
        description: "No donations to download.",
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
    doc.text("GCMN Library - Donations Report", 148.5, 12, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 148.5, 17, { align: "center" });

    let y = 30;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const rowHeight = 8;
    const colWidths = [25, 25, 30, 30, 50, 35];
    const columns = ["Amount", "Method", "Name", "Email", "Message", "Date"];

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

    donations.forEach((donation) => {
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
        `PKR ${Number(donation.amount).toLocaleString()}`,
        donation.method,
        donation.name || "Anonymous",
        donation.email || "-",
        donation.message ? donation.message.substring(0, 20) + "..." : "-",
        new Date(donation.createdAt).toLocaleDateString()
      ];

      rowData.forEach((data, i) => {
        doc.text(data, x, y, { maxWidth: colWidths[i] - 2 });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    doc.save(`gcmn-donations-report-${new Date().getTime()}.pdf`);
    toast({
      title: "Success",
      description: `Downloaded PDF with ${donations.length} donations.`,
    });
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Donations</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadExcel} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </Button>
              <Button variant="outline" onClick={downloadPDF} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={fetchDonations} className="gap-2" data-testid="button-refresh-donations">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Donations</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-donations">
                      PKR {totalDonations.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Donors</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-donors">{donations.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Donation</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-average-donation">
                      PKR {donations.length > 0 ? Math.round(totalDonations / donations.length).toLocaleString() : 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Donations ({donations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : donations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No donations recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donations.map((donation) => (
                        <TableRow key={donation.id} data-testid={`row-donation-${donation.id}`}>
                          <TableCell className="font-semibold">
                            PKR {Number(donation.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{donation.method}</Badge>
                          </TableCell>
                          <TableCell>{donation.name || "Anonymous"}</TableCell>
                          <TableCell>{donation.email || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {donation.message || "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => deleteDonation(donation.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                              data-testid={`button-delete-donation-${donation.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Donations;
