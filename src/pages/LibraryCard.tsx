import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  Wifi,
  Users,
  Computer,
  Library,
  Percent,
  Check,
  ArrowRight,
  ArrowLeft,
  Download,
  CreditCard,
} from "lucide-react";
import { jsPDF } from "jspdf";
import collegeLogo from "@/assets/images/college-logo.png";

const getQRCodeUrl = (text: string, size: number = 100) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
};

const benefits = [
  { icon: BookOpen, title: "Borrow books, DVDs, and audiobooks" },
  { icon: Wifi, title: "Access digital resources from anywhere" },
  { icon: Users, title: "Reserve meeting rooms" },
  { icon: Computer, title: "Free computer and WiFi access" },
  { icon: Library, title: "Interlibrary loan services" },
  { icon: Percent, title: "Discounts at local partners" },
];

const classes = ["Class 11", "Class 12", "ADS I", "ADS II", "BSc Part 1", "BSc Part 2"];
const fields = ["Computer Science", "Pre-Medical", "Pre-Engineering", "Humanities", "Commerce"];

const getFieldCode = (field: string): string => {
  const fieldCodeMap: Record<string, string> = {
    "Computer Science": "CS",
    "Commerce": "COM",
    "Humanities": "HM",
    "Pre-Engineering": "PE",
    "Pre-Medical": "PM"
  };
  return fieldCodeMap[field] || "XX";
};

interface FormData {
  firstName: string;
  lastName: string;
  fatherName: string;
  dob: string;
  studentClass: string;
  field: string;
  rollNo: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
}

interface SubmissionResult {
  cardNumber: string;
  studentId: string;
  issueDate: string;
  validThrough: string;
  formData: FormData;
}

const LibraryCard = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    fatherName: "",
    dob: "",
    studentClass: "",
    field: "",
    rollNo: "",
    email: "",
    phone: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.fatherName || !formData.dob || !formData.studentClass || !formData.field || !formData.rollNo) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.addressStreet || !formData.addressCity || !formData.addressState || !formData.addressZip) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsSubmitting(true);
    try {
      const res = await apiRequest('POST', '/api/library-card-applications', {
        userId: user?.id || null,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fatherName: formData.fatherName,
        dob: formData.dob,
        class: formData.studentClass,
        field: formData.field,
        rollNo: formData.rollNo,
        email: formData.email,
        phone: formData.phone,
        addressStreet: formData.addressStreet,
        addressCity: formData.addressCity,
        addressState: formData.addressState,
        addressZip: formData.addressZip,
      });

      const data = await res.json();

      setSubmissionResult({
        cardNumber: data.cardNumber,
        studentId: data.studentId,
        issueDate: data.issueDate,
        validThrough: data.validThrough,
        formData,
      });

      toast({
        title: "Application Submitted!",
        description: "Your library card application has been submitted successfully.",
      });
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = async () => {
    if (!submissionResult) return;

    const doc = new jsPDF();
    const { cardNumber, studentId, issueDate, validThrough, formData } = submissionResult;
    
    const qrDestination = `https://gcmn-library.replit.dev/library-card/${cardNumber}`;
    const qrCodeUrl = getQRCodeUrl(qrDestination, 100);
    const response = await fetch(qrCodeUrl);
    const blob = await response.blob();
    const qrCodeDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = collegeLogo;
    
    await new Promise((resolve) => {
      logoImg.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = logoImg.width;
    canvas.height = logoImg.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(logoImg, 0, 0);
    const logoDataUrl = canvas.toDataURL('image/jpeg', 0.6);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(22, 78, 59);
    doc.setLineWidth(2);
    doc.roundedRect(15, 15, 180, 120, 5, 5, "FD");

    doc.setFillColor(22, 78, 59);
    doc.rect(15, 15, 180, 35, "F");

    doc.addImage(logoDataUrl, "JPEG", 20, 17, 30, 30);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Government of Sindh", 125, 22, { align: "center" });
    doc.text("College Education Department", 125, 27, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("GOVT COLLEGE FOR MEN NAZIMABAD", 125, 37, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(22, 78, 59);
    doc.text("LIBRARY CARD", 105, 57, { align: "center" });

    doc.setDrawColor(22, 78, 59);
    doc.setLineWidth(0.5);
    doc.line(25, 60, 185, 60);

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");

    const leftX = 25;
    let y = 68;
    const lineHeight = 7;

    doc.setFont("helvetica", "bold");
    doc.text("Name:", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${formData.firstName} ${formData.lastName}`, leftX + 25, y);
    y += lineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Father Name:", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(formData.fatherName, leftX + 32, y);
    y += lineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Date of Birth:", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(formData.dob).toLocaleDateString('en-GB'), leftX + 32, y);
    y += lineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Class:", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(formData.studentClass, leftX + 18, y);
    y += lineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Field:", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${formData.field} (${getFieldCode(formData.field)})`, leftX + 18, y);
    y += lineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Roll Number:", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(formData.rollNo, leftX + 28, y);

    const rightX = 115;
    y = 68;

    doc.setFont("helvetica", "bold");
    doc.text("Library Card ID:", rightX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(22, 78, 59);
    doc.setFontSize(10);
    doc.text(cardNumber, rightX + 35, y);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    y += lineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Student ID:", rightX, y);
    doc.setFont("helvetica", "normal");
    doc.text(studentId, rightX + 25, y);
    y += lineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Issue Date:", rightX, y);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(issueDate).toLocaleDateString('en-GB'), rightX + 25, y);
    y += lineHeight;

    doc.setFont("helvetica", "bold");
    doc.text("Valid Through:", rightX, y);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(validThrough).toLocaleDateString('en-GB'), rightX + 30, y);

    doc.addImage(qrCodeDataUrl, "JPEG", 150, 92, 30, 30, undefined, "FAST");

    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(25, 125, 70, 125);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Principal's Signature", 47.5, 130, { align: "center" });

    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(22, 78, 59);
    doc.setLineWidth(2);
    doc.roundedRect(15, 150, 180, 80, 5, 5, "FD");

    doc.setFillColor(22, 78, 59);
    doc.rect(15, 150, 180, 15, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TERMS & CONDITIONS", 105, 159, { align: "center" });

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const disclaimerY = 172;
    const disclaimerLines = [
      "This card is NOT TRANSFERABLE.",
      "If lost, stolen, or damaged, report immediately to the GCMN Library.",
      "The college is not responsible for misuse.",
      "If found, please return to Government College for Men Nazimabad.",
      "",
      "Contact: Library, GCMN, Nazimabad, Karachi",
      "Email: library@gcmn.edu.pk"
    ];

    disclaimerLines.forEach((line, index) => {
      doc.text(line, 25, disclaimerY + (index * 7));
    });

    doc.save(`library-card-${cardNumber}.pdf`);
  };

  if (submissionResult) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Application Submitted Successfully!
            </h1>
            <p className="text-muted-foreground mb-8">
              Your library card PDF is ready for download.
            </p>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <CreditCard className="w-8 h-8 text-primary" />
                  <span className="text-xl font-mono font-bold text-foreground">
                    {submissionResult.cardNumber}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Library Card ID - Use this to register for library access
                </p>
                <p className="text-xs text-muted-foreground">
                  Student ID: {submissionResult.studentId}
                </p>
              </CardContent>
            </Card>

            <Button onClick={generatePDF} size="lg" className="gap-2" data-testid="button-download-pdf">
              <Download className="w-5 h-5" />
              Download Library Card PDF
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 md:whitespace-nowrap">
            Get Your Library Card
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A library card is your key to unlimited learning. Apply online and start exploring today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-foreground text-center mb-2">Card Benefits</h2>
          <p className="text-muted-foreground text-center mb-8">
            Everything included with your free library card:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{benefit.title}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    s <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-colors ${
                      s < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Application Form - Step {step} of 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder="Enter first name"
                          data-testid="input-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder="Enter last name"
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherName">Father Name *</Label>
                      <Input
                        id="fatherName"
                        value={formData.fatherName}
                        onChange={(e) => handleInputChange("fatherName", e.target.value)}
                        placeholder="Enter father's name"
                        data-testid="input-father-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => handleInputChange("dob", e.target.value)}
                        data-testid="input-dob"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="class">Class *</Label>
                        <Select
                          value={formData.studentClass}
                          onValueChange={(value) => handleInputChange("studentClass", value)}
                        >
                          <SelectTrigger data-testid="select-class">
                            <SelectValue placeholder="Select your class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="field">Field / Group *</Label>
                        <Select
                          value={formData.field}
                          onValueChange={(value) => handleInputChange("field", value)}
                        >
                          <SelectTrigger data-testid="select-field">
                            <SelectValue placeholder="Select your field" />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollNo">Roll Number *</Label>
                      <Input
                        id="rollNo"
                        value={formData.rollNo}
                        onChange={(e) => handleInputChange("rollNo", e.target.value)}
                        placeholder="e.g., E-125"
                        data-testid="input-roll-no"
                      />
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleNext} className="gap-2" data-testid="button-next-step1">
                        Continue <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter email address"
                        data-testid="input-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Enter phone number"
                        data-testid="input-phone"
                      />
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handleBack} className="gap-2" data-testid="button-back-step2">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </Button>
                      <Button onClick={handleNext} className="gap-2" data-testid="button-next-step2">
                        Continue <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="addressStreet">Street Address *</Label>
                      <Input
                        id="addressStreet"
                        value={formData.addressStreet}
                        onChange={(e) => handleInputChange("addressStreet", e.target.value)}
                        placeholder="Enter street address"
                        data-testid="input-address-street"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="addressCity">City *</Label>
                        <Input
                          id="addressCity"
                          value={formData.addressCity}
                          onChange={(e) => handleInputChange("addressCity", e.target.value)}
                          placeholder="Enter city"
                          data-testid="input-address-city"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addressState">State/Province *</Label>
                        <Input
                          id="addressState"
                          value={formData.addressState}
                          onChange={(e) => handleInputChange("addressState", e.target.value)}
                          placeholder="Enter state"
                          data-testid="input-address-state"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressZip">ZIP/Postal Code *</Label>
                      <Input
                        id="addressZip"
                        value={formData.addressZip}
                        onChange={(e) => handleInputChange("addressZip", e.target.value)}
                        placeholder="Enter ZIP code"
                        data-testid="input-address-zip"
                      />
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={handleBack} className="gap-2" data-testid="button-back-step3">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </Button>
                      <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2" data-testid="button-submit-application">
                        {isSubmitting ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LibraryCard;
