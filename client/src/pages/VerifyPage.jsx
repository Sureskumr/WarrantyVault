import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Loader2, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { verificationApi } from "../api/opsApi.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function VerifyPage() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [lookupInvoiceNumber, setLookupInvoiceNumber] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token) return;

    verificationApi
      .byToken(token)
      .then((res) => setResult(res.data))
      .catch((err) =>
        setError(
          err.response?.data?.message || "Could not verify this invoice",
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleLookup = async (e) => {
    e.preventDefault();
    setError(null);
    setLookupResult(null);
    setOtpSent(false);
    setOtpCode("");
    setVerified(false);

    try {
      const res = await verificationApi.lookup({
        invoiceNumber: lookupInvoiceNumber.trim(),
      });
      setLookupResult(res.data || res);
      toast.success(
        "Invoice found. An OTP is being sent to the customer phone on file.",
      );

      const otpRes = await verificationApi.sendOtp({
        invoiceNumber: lookupInvoiceNumber.trim(),
      });
      setOtpSent(true);
      if (otpRes?.data?.devOtp) {
        toast.success(`Demo OTP: ${otpRes.data.devOtp}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not find that invoice.");
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!lookupInvoiceNumber) return;

    setOtpLoading(true);
    setError(null);

    try {
      const res = await verificationApi.verifyOtp({
        invoiceNumber: lookupInvoiceNumber.trim(),
        code: otpCode.trim(),
      });
      setVerified(true);
      setResult(res.data || res);
      toast.success("OTP confirmed. Full warranty details unlocked.");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  if (token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              Verifying…
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <ShieldAlert className="h-10 w-10 text-red-500" />
              <p className="font-medium text-slate-900">Verification failed</p>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          )}

          {!loading && result && (
            <>
              <div className="mb-6 flex flex-col items-center text-center">
                <ShieldCheck className="h-10 w-10 text-green-600" />
                <h1 className="mt-2 text-lg font-semibold text-slate-900">
                  Invoice Verified
                </h1>
                <p className="text-sm text-slate-500">{result.invoiceNumber}</p>
              </div>

              <div className="mb-4 text-center text-sm text-slate-600">
                Purchase date:{" "}
                {new Date(result.purchaseDate).toLocaleDateString()}
                <br />
                Customer: {result.customer?.name}
              </div>

              <div className="space-y-3">
                {result.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="font-medium text-slate-900">
                      {item.brand} {item.product}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <StatusBadge status={item.warranty.status} />
                      <span className="text-slate-500">
                        {item.warranty.daysRemaining} days remaining
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Expires:{" "}
                      {new Date(item.warranty.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">
                Warranty Status shown above reflects the digital record only.
                Actual eligibility depends on manufacturer terms, product
                condition, and proof of purchase.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-green-600" />
          <h1 className="mt-3 text-xl font-semibold text-slate-900">
            Check Warranty
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the invoice number to verify ownership and unlock full
            warranty details via OTP.
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Invoice number
            <input
              value={lookupInvoiceNumber}
              onChange={(e) => setLookupInvoiceNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="INV-2026-09-XXXXXX"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Find invoice
          </button>
        </form>

        {lookupResult && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <Smartphone className="h-4 w-4" />
              OTP sent to {lookupResult.customer?.name || "customer"}
            </div>
            <p className="mt-1 text-amber-800">
              The customer phone on file will receive a verification code. This
              keeps the warranty record secure.
            </p>
          </div>
        )}

        {otpSent && (
          <form onSubmit={handleOtpVerify} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              OTP code
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="Enter 6-digit code"
              />
            </label>

            <button
              type="submit"
              disabled={otpLoading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {otpLoading ? "Verifying…" : "Confirm with SMS"}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {verified && result && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-600">Customer</div>
              <div className="mt-1 font-medium text-slate-900">
                {result.customer?.name}
              </div>
              <div className="text-sm text-slate-600">
                {result.customer?.phone}
              </div>
            </div>

            <div className="space-y-3">
              {result.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="font-medium text-slate-900">
                    {item.brand} {item.product}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <StatusBadge status={item.warranty.status} />
                    <span className="text-slate-500">
                      {item.warranty.daysRemaining} days remaining
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Serial: {item.serialNumber || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
