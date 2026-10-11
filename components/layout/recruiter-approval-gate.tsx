"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  Clock, 
  Building2, 
  Mail, 
  RefreshCw, 
  LogOut, 
  AlertTriangle,
  CheckCircle2,
  Lock
} from "lucide-react";
import { authClient } from "@/lib/auth/client";

interface RecruiterApprovalGateProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    companyName?: string | null;
    verificationStatus: string;
    rejectionReason?: string | null;
  };
  onRefresh: () => Promise<void>;
}

export function RecruiterApprovalGate({ user, onRefresh }: RecruiterApprovalGateProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    try {
      setIsChecking(true);
      setStatusMessage(null);
      await onRefresh();
      setStatusMessage("Status refreshed. Verification is still pending with the Placement Cell.");
    } catch (err) {
      setStatusMessage("Failed to refresh status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    localStorage.removeItem("authToken");
    router.refresh();
    router.push("/login");
  };

  const isRejected = user.verificationStatus === "rejected";

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#fffef7] border-2 border-black p-6 md:p-8 rounded-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
        {/* Top header badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b-2 border-dashed border-gray-300">
          <div className="flex items-center gap-2">
            <span className="bg-black text-[#fcec6a] font-mono text-xs font-bold px-2.5 py-1 rounded-sm border border-black uppercase tracking-wider">
              Royal College Placement OS
            </span>
            <span className={`px-2.5 py-1 text-xs font-mono font-bold rounded-sm border border-black ${
              isRejected ? "bg-red-200 text-red-900" : "bg-[#fcec6a] text-black"
            }`}>
              {isRejected ? "STATUS: REJECTED" : "STATUS: PENDING APPROVAL"}
            </span>
          </div>

          <span className="text-xs font-mono text-gray-500">
            ID #{user.id}
          </span>
        </div>

        {/* Content Body */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className={`size-16 rounded-full border-2 border-black flex items-center justify-center text-3xl shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
              isRejected ? "bg-red-100" : "bg-[#fff9d2]"
            }`}>
              {isRejected ? <ShieldAlert className="size-8 text-red-600" /> : <Clock className="size-8 text-amber-700 animate-pulse" />}
            </div>

            <div>
              <h2 className="font-kalam text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {isRejected 
                  ? "Recruiter Access Denied" 
                  : "Awaiting Placement Cell Approval"}
              </h2>
              <p className="font-mono text-xs md:text-sm text-gray-600 mt-1">
                {isRejected
                  ? "Your corporate recruiter application was reviewed and flagged by the university placement officer."
                  : "Welcome, " + user.name + "! Your account has been submitted to the Placement Cell for verification."}
              </p>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="bg-[#faf9f0] border-2 border-black p-4 rounded-sm space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Building2 className="size-3.5 text-gray-700" /> Organization:
              </span>
              <strong className="font-bold text-gray-900">
                {user.companyName || "Corporate Recruiter Partner"}
              </strong>
            </div>

            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Mail className="size-3.5 text-gray-700" /> Work Email:
              </span>
              <strong className="font-bold text-gray-900">{user.email}</strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1.5">
                <Lock className="size-3.5 text-gray-700" /> Verification Desk:
              </span>
              <strong className="text-emerald-700 font-bold">
                Royal College Placement Cell
              </strong>
            </div>
          </div>

          {/* Institutional Security Notice */}
          {isRejected ? (
            <div className="bg-red-50 border-2 border-red-400 p-4 rounded-sm space-y-2">
              <p className="font-mono text-xs font-bold text-red-800 uppercase flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-red-600 shrink-0" />
                Reason Provided by Placement Officer:
              </p>
              <p className="font-sans text-sm text-red-900 bg-white p-2.5 border border-red-200 rounded font-medium">
                {user.rejectionReason || "Application rejected: Student account detected attempting to register as a corporate recruiter, or unverified organization credentials."}
              </p>
              <p className="font-mono text-[11px] text-red-700">
                If you are a student, please sign out and sign in or register with your regular student account.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-sm space-y-2 font-sans text-xs text-amber-900 leading-relaxed">
              <p className="font-mono font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                🛡️ Why is manual approval enforced?
              </p>
              <p>
                To protect student academic privacy, ensure transparent campus recruitment, and <strong>prevent students from self-registering as recruiters</strong>, all corporate accounts require administrative verification.
              </p>
              <p className="font-mono text-[11px] text-amber-800 border-t border-amber-200 pt-1.5">
                Notice: The placement officer can approve your account instantly via the Placement Cell Dashboard.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {!isRejected && (
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="bg-[#fcec6a] text-black font-kalam font-bold text-xl px-5 py-2.5 rounded-sm border-2 border-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
              >
                <RefreshCw className={`size-4 ${isChecking ? "animate-spin" : ""}`} />
                <span>{isChecking ? "Checking Status..." : "Check Approval Status"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="bg-white text-black font-kalam font-bold text-xl px-5 py-2.5 rounded-sm border-2 border-black hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <LogOut className="size-4 text-gray-600" />
              <span>Sign Out</span>
            </button>
          </div>

          {statusMessage && (
            <p className="font-mono text-xs text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded">
              ℹ️ {statusMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
