import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PageHeader,
  FormSection,
  Tabs,
} from '@/components/ui';
import { configStore } from './configStore';
import { AcademySettings } from './types';
import { toast } from 'sonner';
import {
  Save,
  Building,
  Sliders,
  ShieldCheck,
  ExternalLink,
  Info,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState<AcademySettings>(configStore.getSettings());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    try {
      configStore.updateSettings(settings);
      setTimeout(() => {
        setIsSaving(false);
        toast.success('Academy & System Configuration updated successfully');
      }, 300);
    } catch {
      setIsSaving(false);
      toast.error('Failed to save configuration');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <PageHeader
        title="SYSTEM & ACADEMY CONFIGURATION"
        subtitle="Air-gapped examination parameters, institutional profile, testing rules, and DEFCON radar preferences"
        breadcrumbs={[
          { label: 'Command Console', href: '/admin/dashboard' },
          { label: 'Configuration' },
          { label: 'Settings' },
        ]}
        action={{
          label: isSaving ? 'Saving Changes...' : 'Save Configuration',
          icon: Save,
          onClick: handleSave,
        }}
      />

      {/* Quick Access Shortcuts Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/admin/forces"
          className="p-3 bg-white border border-[#CBD5E1] rounded hover:border-[#0E1B2A] transition-all flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-xs font-bold text-[#0E1B2A] group-hover:text-[#C6A75E] transition-colors">
                Armed Forces Branches
              </div>
              <div className="text-[11px] text-[#64748B]">Army, Navy, Air Force (3)</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8]" />
        </Link>

        <Link
          to="/admin/courses"
          className="p-3 bg-white border border-[#CBD5E1] rounded hover:border-[#0E1B2A] transition-all flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-4 h-4 text-[#C6A75E]" />
            <div>
              <div className="text-xs font-bold text-[#0E1B2A] group-hover:text-[#C6A75E] transition-colors">
                Commissioning Courses
              </div>
              <div className="text-[11px] text-[#64748B]">PMA, GDP, PN Cadet, TCC (6)</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8]" />
        </Link>

        <Link
          to="/admin/subjects"
          className="p-3 bg-white border border-[#CBD5E1] rounded hover:border-[#0E1B2A] transition-all flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center space-x-2.5">
            <Building className="w-4 h-4 text-sky-600" />
            <div>
              <div className="text-xs font-bold text-[#0E1B2A] group-hover:text-[#C6A75E] transition-colors">
                Subject Disciplines
              </div>
              <div className="text-[11px] text-[#64748B]">Intelligence & Academics (10)</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8]" />
        </Link>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="bg-white border border-[#CBD5E1] rounded-md shadow-xs overflow-hidden">
        <Tabs
          tabs={[
            { id: 'profile', label: 'Academy Profile' },
            { id: 'exam', label: 'Examination Defaults' },
            { id: 'proctor', label: 'Proctoring & Air-Gap' },
            { id: 'system', label: 'System Information' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="p-6 space-y-6">
          {/* TAB 1: ACADEMY PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <FormSection
                title="Institutional Identity"
                description="Official credentials of the examination center printed on cadet dockets and stanine certificates"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      value={settings.academyProfile.name}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          academyProfile: {
                            ...settings.academyProfile,
                            name: e.target.value,
                          },
                        })
                      }
                      className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                      Campus Complex Location
                    </label>
                    <input
                      type="text"
                      value={settings.academyProfile.campusLocation}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          academyProfile: {
                            ...settings.academyProfile,
                            campusLocation: e.target.value,
                          },
                        })
                      }
                      className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                      Chief Academic Director / Commanding Officer
                    </label>
                    <input
                      type="text"
                      value={settings.academyProfile.commandOfficer}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          academyProfile: {
                            ...settings.academyProfile,
                            commandOfficer: e.target.value,
                          },
                        })
                      }
                      className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                      CBT Testing Center Station Code
                    </label>
                    <input
                      type="text"
                      value={settings.academyProfile.centerCode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          academyProfile: {
                            ...settings.academyProfile,
                            centerCode: e.target.value.toUpperCase(),
                          },
                        })
                      }
                      className="w-full text-xs font-mono uppercase px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                      Official Contact Email
                    </label>
                    <input
                      type="email"
                      value={settings.academyProfile.contactEmail}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          academyProfile: {
                            ...settings.academyProfile,
                            contactEmail: e.target.value,
                          },
                        })
                      }
                      className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                      Telephone Helpline
                    </label>
                    <input
                      type="text"
                      value={settings.academyProfile.contactPhone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          academyProfile: {
                            ...settings.academyProfile,
                            contactPhone: e.target.value,
                          },
                        })
                      }
                      className="w-full text-xs font-mono px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    />
                  </div>
                </div>
              </FormSection>
            </div>
          )}

          {/* TAB 2: EXAM DEFAULTS */}
          {activeTab === 'exam' && (
            <div className="space-y-6">
              <FormSection
                title="Default Timing & Scoring Benchmarks"
                description="Global baseline presets automatically pre-filled into new Test Builder blueprints"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                      Default Test Battery Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={180}
                      value={settings.examDefaults.defaultDurationMinutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          examDefaults: {
                            ...settings.examDefaults,
                            defaultDurationMinutes: parseInt(e.target.value) || 45,
                          },
                        })
                      }
                      className="w-full text-xs font-mono px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                      Standard Passing Benchmark (%)
                    </label>
                    <input
                      type="number"
                      min={40}
                      max={90}
                      value={settings.examDefaults.passingScorePercent}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          examDefaults: {
                            ...settings.examDefaults,
                            passingScorePercent: parseInt(e.target.value) || 60,
                          },
                        })
                      }
                      className="w-full text-xs font-mono px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                      Answer Key & Telemetry Release Timing
                    </label>
                    <select
                      value={settings.examDefaults.keyReleaseTiming}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          examDefaults: {
                            ...settings.examDefaults,
                            keyReleaseTiming: e.target.value as any,
                          },
                        })
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    >
                      <option value="IMMEDIATE_POST_EXAM">Immediate Instant Review upon Submission</option>
                      <option value="DELAYED_PROCTOR_RELEASE">Delayed (Requires Proctor Authorization)</option>
                      <option value="NEVER">Never (Blind Exam Security Protocol)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                      Defcon Anomaly Tolerance (Max Violations Before Terminal Lock)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.examDefaults.anomalyLockThreshold}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          examDefaults: {
                            ...settings.examDefaults,
                            anomalyLockThreshold: parseInt(e.target.value) || 3,
                          },
                        })
                      }
                      className="w-full text-xs font-mono px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Randomization & Anti-Cheating Presets"
                description="Automated entropy variables applied during candidate test compilation"
              >
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.examDefaults.shuffleQuestions}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          examDefaults: {
                            ...settings.examDefaults,
                            shuffleQuestions: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#0E1B2A] focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#0E1B2A]">
                        Randomize Question Order
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Each terminal receives questions in a unique pseudorandom sequence
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.examDefaults.shuffleOptions}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          examDefaults: {
                            ...settings.examDefaults,
                            shuffleOptions: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#0E1B2A] focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#0E1B2A]">
                        Randomize Answer Options (A, B, C, D)
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Option keys are shuffled dynamically per terminal session
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.examDefaults.negativeMarking}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          examDefaults: {
                            ...settings.examDefaults,
                            negativeMarking: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#0E1B2A] focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#0E1B2A]">
                        Enable Negative Marking Penalty (-0.25 mark per incorrect answer)
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Applies official ISSB negative grading formula to discourage blind guessing
                      </div>
                    </div>
                  </label>
                </div>
              </FormSection>
            </div>
          )}

          {/* TAB 3: PROCTORING & AIR-GAP */}
          {activeTab === 'proctor' && (
            <div className="space-y-6">
              <FormSection
                title="Live Proctor Radar Sensitivity"
                description="Audio-visual monitoring alerts for examination hall invigilators"
              >
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notificationPreferences.proctorSoundAlerts}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notificationPreferences: {
                            ...settings.notificationPreferences,
                            proctorSoundAlerts: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#0E1B2A] focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#0E1B2A]">
                        Audible Alarm on Defcon Radar Anomaly
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Play sober chime at invigilator station when a terminal flags window focus loss
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notificationPreferences.autoFlagAnomalies}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notificationPreferences: {
                            ...settings.notificationPreferences,
                            autoFlagAnomalies: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#0E1B2A] focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#0E1B2A]">
                        Automatic Forensic Timestamp Logging
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Log network latency, question transition velocity, and rapid click anomalies
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notificationPreferences.retakeAlerts}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notificationPreferences: {
                            ...settings.notificationPreferences,
                            retakeAlerts: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#0E1B2A] focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#0E1B2A]">
                        Retake Chamber Approval Notifications
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Alert Chief Proctor when failing scores trigger second-chance qualification
                      </div>
                    </div>
                  </label>
                </div>
              </FormSection>
            </div>
          )}

          {/* TAB 4: SYSTEM INFORMATION */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="bg-[#0E1B2A] text-white p-5 rounded-md space-y-4 font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-[#1C2E42]">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400">
                      AIR-GAP DEFENSE ENVIRONMENT : SECURE
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {settings.systemInfo.softwareVersion}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#64748B] block text-[10px]">BUILD IDENTIFIER</span>
                    <span className="text-slate-200">{settings.systemInfo.buildIdentifier}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">SECURITY SHA-256 CHECK</span>
                    <span className="text-slate-200">{settings.systemInfo.lastSecurityChecksum}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">LAN AIR-GAP MODE</span>
                    <span className="text-emerald-400 font-bold">STRICT OFFLINE (NO REMOTE CDN)</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">ACTIVE CBT TERMINALS</span>
                    <span className="text-slate-200">
                      {settings.systemInfo.terminalWorkstationsOnline} Certified Workstations
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#CBD5E1] p-4 rounded-md space-y-2 text-xs text-[#475569]">
                <div className="font-bold text-[#0E1B2A] flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-[#C6A75E]" />
                  <span>Air-Gapped Operational Compliance Note</span>
                </div>
                <p>
                  This software is configured for sovereign military air-gapped deployments. In
                  accordance with Defense Security Guidelines, all static assets, Google Fonts, and
                  Lucide icons are bundled locally with zero dependence on external CDNs or cloud
                  runtimes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
