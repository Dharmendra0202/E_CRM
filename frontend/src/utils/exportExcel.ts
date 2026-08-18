import * as XLSX from "xlsx";

interface ExportColumn {
  header: string;
  key: string;
}

function exportToExcel(data: Record<string, any>[], columns: ExportColumn[], fileName: string) {
  if (!data || data.length === 0) {
    alert("No records available to export.");
    return;
  }

  const rows = data.map((item, idx) => {
    const row: Record<string, any> = { "Sr. No.": idx + 1 };
    columns.forEach((col) => {
      row[col.header] = item[col.key] ?? "—";
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Records");

  // Auto-size columns for neat display in Excel
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key] || "").length)) + 3,
  }));
  worksheet["!cols"] = colWidths;

  const timestamp = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
}

// 1. Export Invoices / Payment Records
export function exportInvoices(invoices: any[], students: any[] = []) {
  const formatted = invoices.map((inv) => {
    const matchedStudent = students.find((s: any) => s.id === inv.studentId || s.id === inv.student?.id);
    const studentName = inv.student?.user
      ? `${inv.student.user.firstName} ${inv.student.user.lastName}`
      : matchedStudent?.user
      ? `${matchedStudent.user.firstName} ${matchedStudent.user.lastName}`
      : matchedStudent?.name || matchedStudent?.parentName || "Student";

    const studentEmail = inv.student?.user?.email || matchedStudent?.email || matchedStudent?.user?.email || "N/A";
    const studentPhone = inv.student?.user?.phone || matchedStudent?.phone || matchedStudent?.user?.phone || matchedStudent?.parentPhone || "N/A";
    const batchName = matchedStudent?.enrollments?.[0]?.batch?.name || matchedStudent?.batch || inv.student?.enrollments?.[0]?.batch?.name || "General Batch";
    const parentName = matchedStudent?.parentName || matchedStudent?.guardianName || "N/A";
    const parentContact = matchedStudent?.parentPhone || matchedStudent?.guardianPhone || "N/A";

    const createdDateObj = new Date(inv.createdAt || Date.now());
    const year = createdDateObj.getFullYear();
    const dateIssued = createdDateObj.toLocaleDateString("en-IN");
    const timeIssued = createdDateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const dueDate = new Date(inv.dueDate).toLocaleDateString("en-IN");

    const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
    const remaining = Math.max(0, Number(inv.totalAmount) - paid);

    const paymentModes = inv.payments && inv.payments.length > 0
      ? Array.from(new Set(inv.payments.map((p: any) => p.paymentMethod || "CASH"))).join(" + ")
      : (inv.status === "PAID" ? "ONLINE / CASH" : "PENDING");

    const txRefs = inv.payments && inv.payments.length > 0
      ? inv.payments.map((p: any) => p.transactionReference || "REF-OK").filter(Boolean).join("; ")
      : "N/A";

    return {
      studentName,
      studentEmail,
      studentPhone,
      batchName,
      parentName,
      parentContact,
      year,
      dateIssued,
      timeIssued,
      dueDate,
      totalAmount: `₹${Number(inv.totalAmount).toLocaleString("en-IN")}`,
      paidAmount: `₹${paid.toLocaleString("en-IN")}`,
      remainingDues: `₹${remaining.toLocaleString("en-IN")}`,
      paymentModes,
      txRefs,
      status: inv.status,
    };
  });

  const columns: ExportColumn[] = [
    { header: "Student Name", key: "studentName" },
    { header: "Student Email", key: "studentEmail" },
    { header: "Student Phone", key: "studentPhone" },
    { header: "Batch / Class", key: "batchName" },
    { header: "Parent Name", key: "parentName" },
    { header: "Parent Contact", key: "parentContact" },
    { header: "Year", key: "year" },
    { header: "Date Issued", key: "dateIssued" },
    { header: "Time Issued", key: "timeIssued" },
    { header: "Due Date", key: "dueDate" },
    { header: "Total Billed", key: "totalAmount" },
    { header: "Amount Paid", key: "paidAmount" },
    { header: "Remaining Dues", key: "remainingDues" },
    { header: "Payment Mode (Cash/UPI/Bank)", key: "paymentModes" },
    { header: "Transaction Ref / ID", key: "txRefs" },
    { header: "Payment Status", key: "status" },
  ];

  exportToExcel(formatted, columns, "CRM_Payment_Records");
}

// 2. Export Enrolled Students
export function exportStudents(students: any[]) {
  const formatted = students.map((s) => {
    const createdDateObj = new Date(s.createdAt || s.enrollmentDate || Date.now());
    return {
      name: s.name || (s.user ? `${s.user.firstName} ${s.user.lastName}` : "Student"),
      email: s.email || s.user?.email || "N/A",
      phone: s.phone || s.user?.phone || "N/A",
      gender: s.gender || "—",
      dob: s.dob || s.dateOfBirth || "—",
      batch: s.batch || s.enrollments?.[0]?.batch?.name || "12th Science",
      parentName: s.parentName || s.guardianName || "—",
      parentPhone: s.parentPhone || s.guardianPhone || "—",
      parentEmail: s.parentEmail || "—",
      address: s.address || "—",
      feeAmount: s.feeAmount ? `₹${s.feeAmount}` : "₹10,000",
      year: createdDateObj.getFullYear(),
      dateEnrolled: createdDateObj.toLocaleDateString("en-IN"),
      timeEnrolled: createdDateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      status: s.status || "ACTIVE",
    };
  });

  const columns: ExportColumn[] = [
    { header: "Student Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Gender", key: "gender" },
    { header: "Date of Birth", key: "dob" },
    { header: "Class / Batch", key: "batch" },
    { header: "Parent Name", key: "parentName" },
    { header: "Parent Phone", key: "parentPhone" },
    { header: "Parent Email", key: "parentEmail" },
    { header: "Address", key: "address" },
    { header: "Total Fee", key: "feeAmount" },
    { header: "Year", key: "year" },
    { header: "Enrolled Date", key: "dateEnrolled" },
    { header: "Enrolled Time", key: "timeEnrolled" },
    { header: "Status", key: "status" },
  ];

  exportToExcel(formatted, columns, "Enrolled_Students_List");
}

// 3. Export Staff & Teachers
export function exportStaff(staff: any[]) {
  const formatted = staff.map((s) => {
    const createdDateObj = new Date(s.createdAt || Date.now());
    return {
      name: s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Staff Member",
      email: s.email || "N/A",
      phone: s.phone || "N/A",
      role: s.role || "STAFF",
      title: s.title || s.teacher?.qualification || "—",
      year: createdDateObj.getFullYear(),
      regDate: createdDateObj.toLocaleDateString("en-IN"),
      regTime: createdDateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  });

  const columns: ExportColumn[] = [
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Role", key: "role" },
    { header: "Qualification / Title", key: "title" },
    { header: "Year Registered", key: "year" },
    { header: "Registration Date", key: "regDate" },
    { header: "Registration Time", key: "regTime" },
  ];

  exportToExcel(formatted, columns, "Staff_And_Teachers_Directory");
}

// 4. Export Attendance Logs
export function exportAttendance(records: any[]) {
  const formatted = records.map((r) => {
    const createdDateObj = new Date(r.classDate || r.createdAt || Date.now());
    return {
      studentName: r.student?.user ? `${r.student.user.firstName} ${r.student.user.lastName}` : r.studentName || "Student",
      batch: r.batchName || r.schedule?.batch?.name || "General Class",
      year: createdDateObj.getFullYear(),
      date: createdDateObj.toLocaleDateString("en-IN"),
      time: createdDateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      status: r.status || "PRESENT",
      remarks: r.remarks || "—",
    };
  });

  const columns: ExportColumn[] = [
    { header: "Student Name", key: "studentName" },
    { header: "Batch / Class", key: "batch" },
    { header: "Year", key: "year" },
    { header: "Session Date", key: "date" },
    { header: "Session Time", key: "time" },
    { header: "Attendance Status", key: "status" },
    { header: "Remarks", key: "remarks" },
  ];

  exportToExcel(formatted, columns, "Student_Attendance_Logs");
}

// 5. Export Admissions Leads
export function exportAdmissions(leads: any[]) {
  const formatted = leads.map((l) => {
    const createdDateObj = new Date(l.createdAt || Date.now());
    return {
      name: l.name || `${l.firstName || ""} ${l.lastName || ""}`.trim(),
      email: l.email || "N/A",
      phone: l.phone || "N/A",
      course: l.source || l.targetClass || "General Inquiry",
      status: l.status || "NEW",
      year: createdDateObj.getFullYear(),
      date: createdDateObj.toLocaleDateString("en-IN"),
      time: createdDateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  });

  const columns: ExportColumn[] = [
    { header: "Candidate Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Course / Batch Interest", key: "course" },
    { header: "Lead Status", key: "status" },
    { header: "Year", key: "year" },
    { header: "Inquiry Date", key: "date" },
    { header: "Inquiry Time", key: "time" },
  ];

  exportToExcel(formatted, columns, "Admissions_CRM_Leads");
}

// 6. Export Teachers
export function exportTeachers(teachers: any[]) {
  const formatted = teachers.map((t) => {
    const createdDateObj = new Date(t.createdAt || Date.now());
    return {
      name: t.name || `${t.user?.firstName || t.firstName || ""} ${t.user?.lastName || t.lastName || ""}`.trim() || "Teacher",
      email: t.email || t.user?.email || "N/A",
      phone: t.phone || t.user?.phone || "N/A",
      qualification: t.qualification || t.title || "—",
      year: createdDateObj.getFullYear(),
      regDate: createdDateObj.toLocaleDateString("en-IN"),
      regTime: createdDateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  });

  const columns: ExportColumn[] = [
    { header: "Teacher Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Qualification / Specialization", key: "qualification" },
    { header: "Year Joined", key: "year" },
    { header: "Registration Date", key: "regDate" },
    { header: "Registration Time", key: "regTime" },
  ];

  exportToExcel(formatted, columns, "Teachers_Directory");
}

// 7. Export All System Users
export function exportLoginUsers(users: any[]) {
  const formatted = users.map((u) => {
    const createdDateObj = new Date(u.createdAt || Date.now());
    return {
      name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "System User",
      email: u.email || "N/A",
      phone: u.phone || "N/A",
      role: u.role || "USER",
      emailVerified: u.emailVerified ? "VERIFIED" : "PENDING",
      year: createdDateObj.getFullYear(),
      regDate: createdDateObj.toLocaleDateString("en-IN"),
      regTime: createdDateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  });

  const columns: ExportColumn[] = [
    { header: "User Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "System Role", key: "role" },
    { header: "Email Verification", key: "emailVerified" },
    { header: "Year Registered", key: "year" },
    { header: "Registration Date", key: "regDate" },
    { header: "Registration Time", key: "regTime" },
  ];

  exportToExcel(formatted, columns, "System_Users_List");
}
