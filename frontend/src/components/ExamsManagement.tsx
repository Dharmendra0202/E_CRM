import React, { useState } from "react";
import {
  Award, GraduationCap, CheckCircle2, FileText, Plus, Search,
  Download, Printer, Sparkles, AlertCircle, BookOpen, Clock, User
} from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

export function ExamsManagement() {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [filterClass, setFilterClass] = useState("ALL");

  const mockExams = [
    { id: "EX-101", title: "Mid-Term Mathematics", date: "2026-07-15", class: "Class X-A", totalStudents: 32, status: "PUBLISHED" },
    { id: "EX-102", title: "Physics Quarterly Exam", date: "2026-07-20", class: "Class XII-B", totalStudents: 28, status: "PUBLISHED" },
    { id: "EX-103", title: "Chemistry Mock Test", date: "2026-07-28", class: "Class XI-A", totalStudents: 30, status: "UPCOMING" },
  ];

  const mockStudents = [
    { id: "STU-001", name: "Rahul Sharma", rollNo: "101", class: "Class X-A", math: 92, physics: 88, chemistry: 95, total: 275, grade: "A+", result: "PASS" },
    { id: "STU-002", name: "Priya Patel", rollNo: "102", class: "Class X-A", math: 85, physics: 90, chemistry: 89, total: 264, grade: "A", result: "PASS" },
    { id: "STU-003", name: "Amit Kumar", rollNo: "103", class: "Class X-A", math: 78, physics: 82, chemistry: 75, total: 235, grade: "B+", result: "PASS" },
    { id: "STU-004", name: "Sneha Verma", rollNo: "104", class: "Class X-A", math: 96, physics: 94, chemistry: 98, total: 288, grade: "A+", result: "PASS" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gradient-indigo flex items-center gap-2">
            <Award className="text-pink-500" size={26} /> Exams & Report Cards
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Generate student report cards, track grades & publish exam results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white gap-2">
            <Plus size={16} /> Create New Exam
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
            <Award size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-800">12</div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Exams</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-800">94.2%</div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Pass Rate</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-800">148</div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Report Cards</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-neutral-800">A+</div>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Top Grade</div>
          </div>
        </Card>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Student Marks List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <h3 className="font-bold text-base text-neutral-800 flex items-center gap-2">
                <FileText size={18} className="text-pink-500" /> Class X-A Results Ledger
              </h3>
              <div className="text-xs text-neutral-400 font-semibold">4 Students Listed</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 text-neutral-500 uppercase tracking-wider font-bold">
                    <th className="py-2.5 px-3">Roll No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-center">Math</th>
                    <th className="py-2.5 px-3 text-center">Physics</th>
                    <th className="py-2.5 px-3 text-center">Chemistry</th>
                    <th className="py-2.5 px-3 text-center">Total</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {mockStudents.map(student => (
                    <tr key={student.id} className="hover:bg-pink-50/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-neutral-600">#{student.rollNo}</td>
                      <td className="py-3 px-3 font-bold text-neutral-900">{student.name}</td>
                      <td className="py-3 px-3 text-center">{student.math}</td>
                      <td className="py-3 px-3 text-center">{student.physics}</td>
                      <td className="py-3 px-3 text-center">{student.chemistry}</td>
                      <td className="py-3 px-3 text-center font-bold text-pink-600">{student.total}/300</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                          {student.grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors cursor-pointer"
                        >
                          Report Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Col: Interactive Printable Report Card Preview */}
        <div>
          <Card className="p-5 border-pink-200/80 bg-gradient-to-b from-white to-pink-50/30">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-pink-100">
              <h3 className="font-bold text-sm text-neutral-800 flex items-center gap-2">
                <Printer size={16} className="text-pink-500" /> Printable Report Card
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-pink-500 text-white">LIVE PREVIEW</span>
            </div>

            {selectedStudent ? (
              <div className="bg-white rounded-xl border border-pink-200 p-4 shadow-md space-y-4">
                {/* School Header */}
                <div className="text-center pb-3 border-b border-neutral-100">
                  <GraduationCap size={28} className="mx-auto text-pink-500 mb-1" />
                  <h4 className="font-extrabold text-sm text-neutral-900">E-CRM ACADEMY</h4>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest">Official Academic Progress Report</p>
                </div>

                {/* Student Bio */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-pink-50/50 p-2.5 rounded-lg border border-pink-100">
                  <div><span className="text-neutral-400">Name:</span> <strong className="text-neutral-800">{selectedStudent.name}</strong></div>
                  <div><span className="text-neutral-400">Roll:</span> <strong className="text-neutral-800">{selectedStudent.rollNo}</strong></div>
                  <div><span className="text-neutral-400">Class:</span> <strong className="text-neutral-800">{selectedStudent.class}</strong></div>
                  <div><span className="text-neutral-400">Status:</span> <strong className="text-emerald-600">{selectedStudent.result}</strong></div>
                </div>

                {/* Marks Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-600">Mathematics</span>
                    <span className="font-bold text-neutral-800">{selectedStudent.math}/100</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-600">Physics</span>
                    <span className="font-bold text-neutral-800">{selectedStudent.physics}/100</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-600">Chemistry</span>
                    <span className="font-bold text-neutral-800">{selectedStudent.chemistry}/100</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-sm text-pink-600 pt-2">
                    <span>Aggregate Marks</span>
                    <span>{selectedStudent.total}/300 ({selectedStudent.grade})</span>
                  </div>
                </div>

                {/* Print Button */}
                <Button
                  onClick={() => window.print()}
                  variant="primary"
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white gap-2 justify-center py-2"
                >
                  <Printer size={15} /> Print Official Card
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-400 text-xs">
                <FileText size={36} className="mx-auto text-neutral-300 mb-2 opacity-60" />
                Select any student from the ledger to generate & preview their official printable report card.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
