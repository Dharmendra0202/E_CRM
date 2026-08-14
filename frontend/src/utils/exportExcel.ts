import * as XLSX from "xlsx";

interface ExportColumn {
  header: string;
  key: string;
}

function exportToExcel(data: Record<string, any>[], columns: ExportColumn[], fileName: string) {
  const rows = data.map((item, idx) => {
    const row: Record<string, any> = { "Sr.No": idx + 1 };
    columns.forEach((col) => {
      row[col.header] = item[col.key] ?? "—";
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Auto-size columns
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key] || "").length)) + 2,
  }));
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

// Export enrolled students
export function exportStudents(students: any[]) {
  const columns: ExportColumn[] = [
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Gender", key: "gender" },
    { header: "Date of Birth", key: "dob" },
    { header: "Class / Batch", key: "batch" },
    { header: "Father Name", key: "guardianName" },
    { header: "Father Phone", key: "guardianPhone" },
    { header: "Mother Name", key: "motherName" },
    { header: "Mother Phone", key: "motherPhone" },
    { header: "Address", key: "address" },
    { header: "Fee Amount", key: "feeAmount" },
    { header: "Fee Status", key: "feeStatus" },
    { header: "Enrolled Date", key: "enrollmentDate" },
    { header: "Status", key: "status" },
  ];
  exportToExcel(students, columns, "Enrolled_Students");
}

// Export staff members
export function exportStaff(staff: any[]) {
  const columns: ExportColumn[] = [
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Role", key: "role" },
    { header: "Qualification", key: "title" },
  ];
  exportToExcel(staff, columns, "Staff_Members");
}

// Export teachers
export function exportTeachers(teachers: any[]) {
  const columns: ExportColumn[] = [
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Qualification", key: "title" },
  ];
  exportToExcel(teachers, columns, "Teachers");
}

// Export all login users
export function exportLoginUsers(users: any[]) {
  const columns: ExportColumn[] = [
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Phone", key: "phone" },
    { header: "Role", key: "role" },
    { header: "Email Verified", key: "emailVerified" },
    { header: "Registered Date", key: "createdAt" },
  ];
  exportToExcel(users, columns, "Login_Users");
}
