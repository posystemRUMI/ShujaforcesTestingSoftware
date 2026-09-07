import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, FormSection, DataTable, ColumnDef, StatusBadge } from '@/components/ui';
import { Upload, FileSpreadsheet, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { studentStore } from './studentStore';
import { toast } from 'sonner';

interface ParsedCandidate {
  id: string;
  fullName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  rollNumber: string;
  branch: 'PAKISTAN_ARMY' | 'PAKISTAN_AIR_FORCE' | 'PAKISTAN_NAVY';
  batchCode: string;
  isValid: boolean;
  validationError?: string;
}

const SAMPLE_CSV_ROWS: ParsedCandidate[] = [
  {
    id: 'row-1',
    fullName: 'Kamran Akmal',
    fatherName: 'Akmal Khan',
    cnic: '37405-5544332-1',
    phone: '0300-9988776',
    rollNumber: 'PMA-2650',
    branch: 'PAKISTAN_ARMY',
    batchCode: '154-PMA-LC',
    isValid: true,
  },
  {
    id: 'row-2',
    fullName: 'Junaid Jamshed',
    fatherName: 'Jamshed Iqbal',
    cnic: '35201-1122334-5',
    phone: '0321-7766554',
    rollNumber: 'PAF-4490',
    branch: 'PAKISTAN_AIR_FORCE',
    batchCode: '158-GDP-PAF',
    isValid: true,
  },
  {
    id: 'row-3',
    fullName: 'Zubair Ali',
    fatherName: 'Ali Asghar',
    cnic: '42101-9988', // Invalid CNIC format
    phone: '0333-1122334',
    rollNumber: 'PNC-1199',
    branch: 'PAKISTAN_NAVY',
    batchCode: 'PNC-2026-A',
    isValid: false,
    validationError: 'CNIC format error: missing digits (00000-0000000-0)',
  },
];

export const StudentImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'completed'>('upload');
  const [parsedData, setParsedData] = useState<ParsedCandidate[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const handleSimulateUpload = () => {
    setParsedData(SAMPLE_CSV_ROWS);
    setCurrentStep('preview');
    toast.success('Roster file parsed: 3 candidates detected');
  };

  const handleExecuteImport = () => {
    const validRows = parsedData.filter((r) => r.isValid);
    validRows.forEach((r) => {
      studentStore.create({
        fullName: r.fullName,
        fatherName: r.fatherName,
        cnic: r.cnic,
        phone: r.phone,
        rollNumber: r.rollNumber,
        branch: r.branch,
        batchId: 'batch-001',
        batchCode: r.batchCode,
        targetCourse: r.branch === 'PAKISTAN_ARMY' ? '154 PMA' : r.branch === 'PAKISTAN_AIR_FORCE' ? '158 GDP' : 'PNC 2026',
        status: 'ACTIVE',
      });
    });
    setImportedCount(validRows.length);
    setCurrentStep('completed');
    toast.success(`${validRows.length} candidates successfully integrated into active roster`);
  };

  const previewColumns: ColumnDef<ParsedCandidate>[] = [
    {
      header: 'Roll ID',
      accessorKey: 'rollNumber',
      className: 'font-mono font-bold text-[#0E1B2A]',
    },
    {
      header: 'Candidate Name',
      cell: (row) => (
        <div>
          <span className="font-bold text-[#0E1B2A]">{row.fullName}</span>
          <span className="block text-[10px] text-[#64748B]">S/O {row.fatherName}</span>
        </div>
      ),
    },
    {
      header: 'CNIC',
      accessorKey: 'cnic',
      className: 'font-mono text-[#64748B]',
    },
    {
      header: 'Service Branch',
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-xs font-sans text-[10px] font-bold uppercase tracking-wider bg-[#0E1B2A] text-white">
          {row.branch.replace('PAKISTAN_', '')}
        </span>
      ),
    },
    {
      header: 'Validation',
      cell: (row) => (
        <div className="flex items-center space-x-1.5">
          <StatusBadge
            status={row.isValid ? 'pass' : 'fail'}
            label={row.isValid ? 'VALIDATED' : 'ERROR'}
          />
          {row.validationError && (
            <span className="text-[10px] text-[#782525] truncate max-w-xs" title={row.validationError}>
              {row.validationError}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      <PageHeader
        title="Batch Candidate CSV/Excel Import"
        subtitle="4-Stage Onboarding Flow: File Upload → Pre-Parse → Integrity Validation → Docket Commitment"
        breadcrumbs={[
          { label: 'Cadets Roster', href: '/admin/students' },
          { label: 'Bulk Import' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#D4D9DF] hover:bg-[#EDF1F5] text-[#0E1B2A] rounded text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Roster</span>
          </button>
        }
      />

      {/* Step Indicator */}
      <div className="grid grid-cols-3 gap-3 p-1 bg-[#EDF1F5] rounded border border-[#D4D9DF] text-xs font-sans">
        <div
          className={`py-2 px-3 text-center rounded font-semibold ${
            currentStep === 'upload' ? 'bg-[#0E1B2A] text-white' : 'text-[#64748B]'
          }`}
        >
          1. Upload Spreadsheets
        </div>
        <div
          className={`py-2 px-3 text-center rounded font-semibold ${
            currentStep === 'preview' ? 'bg-[#0E1B2A] text-white' : 'text-[#64748B]'
          }`}
        >
          2. Preview & Validation
        </div>
        <div
          className={`py-2 px-3 text-center rounded font-semibold ${
            currentStep === 'completed' ? 'bg-[#0E1B2A] text-white' : 'text-[#64748B]'
          }`}
        >
          3. Final Verification
        </div>
      </div>

      {/* Step 1: Upload */}
      {currentStep === 'upload' && (
        <FormSection
          title="Upload Cohort Roster File"
          subtitle="Support for official CSV and Excel formatted roster sheets"
        >
          <div
            onClick={handleSimulateUpload}
            className="border-2 border-dashed border-[#D4D9DF] hover:border-[#0E1B2A] bg-[#F6F8FA] hover:bg-[#EDF1F5] rounded p-12 text-center cursor-pointer transition-colors space-y-3 flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded bg-white flex items-center justify-center text-[#0E1B2A] shadow-xs border border-[#D4D9DF]">
              <FileSpreadsheet className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] block">
                Click to load candidate induction roster CSV
              </span>
              <span className="text-[11px] text-[#64748B]">
                Columns required: FullName, FatherName, CNIC, Phone, RollNumber, Branch, BatchCode
              </span>
            </div>
          </div>
        </FormSection>
      )}

      {/* Step 2: Preview & Validation */}
      {currentStep === 'preview' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#EDF6F0] border border-[#88BE9B] rounded flex items-center justify-between text-xs text-[#234E35]">
            <div className="flex items-center space-x-2 font-sans">
              <CheckCircle2 className="w-4 h-4 text-[#234E35]" />
              <span>
                2 Valid Candidates Ready • 1 Record Excluded (CNIC Format Anomaly)
              </span>
            </div>
            <span className="font-semibold uppercase text-[10px]">Verification Complete</span>
          </div>

          <DataTable
            columns={previewColumns}
            data={parsedData}
            keyExtractor={(item) => item.id}
          />

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep('upload')}
              className="px-4 py-2 border border-[#D4D9DF] text-xs font-semibold rounded text-[#0E1B2A] hover:bg-[#EDF1F5]"
            >
              Re-Upload File
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-[#0E1B2A] hover:bg-[#1A2C42] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Commit Validated Candidates</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Completed */}
      {currentStep === 'completed' && (
        <div className="bg-white border-2 border-[#0E1B2A] rounded p-8 text-center space-y-4 shadow-[0_4px_0_0_rgba(14,27,42,0.06)]">
          <div className="w-14 h-14 rounded bg-[#EDF6F0] border border-[#88BE9B] flex items-center justify-center text-[#234E35] mx-auto">
            <CheckCircle2 className="w-8 h-8 stroke-[2]" />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-wider text-[#0E1B2A] font-display">
            Batch Induction Onboarding Finalized
          </h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Successfully integrated <strong>{importedCount}</strong> new candidates into the academy testing database. Individual workstation credentials and initial testing schedules have been staged.
          </p>
          <div className="pt-3">
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0E1B2A] hover:bg-[#1A2C42] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              <span>View Updated Cadets Roster</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentImportPage;
