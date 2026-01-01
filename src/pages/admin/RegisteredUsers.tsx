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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, RefreshCw, Search, GraduationCap, Briefcase, Download, FileSpreadsheet, PieChart } from "lucide-react";
import { PieChart as ReChartsPie, Pie, Cell, ResponsiveContainer, Tooltip as ReChartsTooltip, Legend } from 'recharts';
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

interface Student {
  id: string;
  userId: string;
  cardId: string;
  name: string;
  class: string | null;
  field: string | null;
  rollNo: string | null;
  createdAt: string;
}

interface NonStudent {
  id: string;
  userId: string;
  name: string;
  role: string;
  phone: string | null;
  createdAt: string;
}

const RegisteredUsers = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [nonStudents, setNonStudents] = useState<NonStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("students");
  const { toast } = useToast();

  const studentData = [
    { name: 'Students', value: students.length },
    { name: 'Staff/Visitors', value: nonStudents.length },
  ];
  const COLORS = ['#164e3b', '#22c55e', '#86efac', '#dcfce7'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });

      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await res.json();

      setStudents(data.students || []);
      setNonStudents(data.nonStudents || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredStudents = students.filter((s) => {
    const search = searchQuery.toLowerCase();
    return (
      s.cardId.toLowerCase().includes(search) ||
      s.name.toLowerCase().includes(search) ||
      (s.rollNo?.toLowerCase().includes(search) || false)
    );
  });

  const filteredNonStudents = nonStudents.filter((ns) => {
    const search = searchQuery.toLowerCase();
    return (
      ns.name.toLowerCase().includes(search) ||
      ns.role.toLowerCase().includes(search)
    );
  });

  const downloadStudentsExcel = () => {
    if (filteredStudents.length === 0) {
      toast({
        title: "No Data",
        description: "No students to download.",
        variant: "destructive",
      });
      return;
    }

    const excelData = filteredStudents.map((student) => ({
      "Library Card ID": student.cardId,
      "Name": student.name,
      "Class": student.class || "-",
      "Field": student.field || "-",
      "Roll No": student.rollNo || "-",
      "Registered Date": new Date(student.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "registered_students.xlsx");

    toast({
      title: "Success",
      description: `Downloaded Excel file with ${filteredStudents.length} students.`,
    });
  };

  const downloadStudentsPDF = () => {
    if (students.length === 0) {
      toast({
        title: "No Data",
        description: "No students to download.",
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
    doc.text("GCMN Library - Registered Students", 148.5, 12, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 148.5, 17, { align: "center" });

    let y = 30;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const rowHeight = 8;
    const colWidths = [30, 35, 25, 35, 25, 30];
    const columns = ["Card ID", "Name", "Class", "Field", "Roll No", "Date"];

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

    filteredStudents.forEach((student) => {
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
        student.cardId,
        student.name,
        student.class || "-",
        student.field || "-",
        student.rollNo || "-",
        new Date(student.createdAt).toLocaleDateString()
      ];

      rowData.forEach((data, i) => {
        doc.text(data, x, y, { maxWidth: colWidths[i] - 2 });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    doc.save(`gcmn-students-report-${new Date().getTime()}.pdf`);
    toast({
      title: "Success",
      description: `Downloaded PDF with ${filteredStudents.length} students.`,
    });
  };

  const downloadStaffExcel = () => {
    if (filteredNonStudents.length === 0) {
      toast({
        title: "No Data",
        description: "No staff/visitors to download.",
        variant: "destructive",
      });
      return;
    }

    const excelData = filteredNonStudents.map((staff) => ({
      "Name": staff.name,
      "Role": staff.role,
      "Phone": staff.phone || "-",
      "Registered Date": new Date(staff.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff & Visitors");
    XLSX.writeFile(workbook, "staff_visitors.xlsx");

    toast({
      title: "Success",
      description: `Downloaded Excel file with ${filteredNonStudents.length} staff/visitors.`,
    });
  };

  const downloadStaffPDF = () => {
    if (nonStudents.length === 0) {
      toast({
        title: "No Data",
        description: "No staff/visitors to download.",
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
    doc.text("GCMN Library - Staff & Visitors", 148.5, 12, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 148.5, 17, { align: "center" });

    let y = 30;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const rowHeight = 8;
    const colWidths = [40, 40, 50, 50];
    const columns = ["Name", "Role", "Phone", "Date"];

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

    filteredNonStudents.forEach((staff) => {
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
        staff.name,
        staff.role,
        staff.phone || "-",
        new Date(staff.createdAt).toLocaleDateString()
      ];

      rowData.forEach((data, i) => {
        doc.text(data, x, y, { maxWidth: colWidths[i] - 2 });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    doc.save(`gcmn-staff-report-${new Date().getTime()}.pdf`);
    toast({
      title: "Success",
      description: `Downloaded PDF with ${filteredNonStudents.length} staff/visitors.`,
    });
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Registered Users</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-users"
                />
              </div>
              <Button variant="outline" onClick={fetchUsers} className="gap-2" data-testid="button-refresh-users">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          {activeTab === "students" && (
            <div className="mb-4 flex gap-2">
              <Button variant="outline" onClick={downloadStudentsExcel} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </Button>
              <Button variant="outline" onClick={downloadStudentsPDF} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          )}

          {activeTab === "non-students" && (
            <div className="mb-4 flex gap-2">
              <Button variant="outline" onClick={downloadStaffExcel} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Download Excel
              </Button>
              <Button variant="outline" onClick={downloadStaffPDF} className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChartsPie>
                    <Pie
                      data={studentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {studentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReChartsTooltip />
                    <Legend />
                  </ReChartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 p-6 rounded-xl text-center">
                  <GraduationCap className="mx-auto mb-2 text-primary" size={32} />
                  <p className="text-3xl font-bold text-primary">{students.length}</p>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Students</p>
                </div>
                <div className="bg-secondary p-6 rounded-xl text-center">
                  <Briefcase className="mx-auto mb-2 text-primary" size={32} />
                  <p className="text-3xl font-bold text-primary">{nonStudents.length}</p>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Staff & Visitors</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="students" className="gap-2">
                <GraduationCap className="w-4 h-4" />
                Students ({students.length})
              </TabsTrigger>
              <TabsTrigger value="non-students" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Staff/Visitors ({nonStudents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Registered Students</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No students found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Library Card ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Field</TableHead>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Registered</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student) => (
                            <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                              <TableCell className="font-mono text-sm text-primary font-medium">
                                {student.cardId}
                              </TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>{student.class || "-"}</TableCell>
                              <TableCell>{student.field || "-"}</TableCell>
                              <TableCell>{student.rollNo || "-"}</TableCell>
                              <TableCell>
                                {new Date(student.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="non-students">
              <Card>
                <CardHeader>
                  <CardTitle>Staff & Visitors</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : filteredNonStudents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Registered</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredNonStudents.map((user) => (
                            <TableRow key={user.id} data-testid={`row-non-student-${user.id}`}>
                              <TableCell>{user.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{user.role}</Badge>
                              </TableCell>
                              <TableCell>{user.phone || "-"}</TableCell>
                              <TableCell>
                                {new Date(user.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisteredUsers;
