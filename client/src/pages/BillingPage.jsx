import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Trash2, Plus, ShoppingCart, UserPlus } from "lucide-react";
import { productApi, customerApi } from "../api/resourceApi.js";
import { invoiceApi } from "../api/opsApi.js";
import PageHeader from "../components/PageHeader.jsx";

export default function BillingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", "billing-search", productSearch],
    queryFn: () =>
      productApi.list({ limit: 10, search: productSearch || undefined }),
  });
  const { data: customersData } = useQuery({
    queryKey: ["customers", "billing-search", customerSearch],
    queryFn: () =>
      customerApi.list({ limit: 10, search: customerSearch || undefined }),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (payload) => customerApi.create(payload),
    onSuccess: (res) => {
      const created = res.data?.customer || res.data;
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setCustomerId(created._id);
      setCustomerSearch("");
      setNewCustomer({ name: "", phone: "", email: "" });
      setShowCustomerForm(false);
      toast.success("Customer added and selected");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to add customer"),
  });

  const addProduct = (product) => {
    if (lines.some((l) => l.productId === product._id)) {
      setLines((prev) =>
        prev.map((l) =>
          l.productId === product._id ? { ...l, quantity: l.quantity + 1 } : l,
        ),
      );
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        productId: product._id,
        name: product.name,
        price: product.price,
        taxRate: product.taxRate || 0,
        quantity: 1,
        serialNumber: "",
        serialNumberRequired: product.serialNumberRequired,
        discount: 0,
      },
    ]);
  };

  const updateLine = (productId, patch) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)),
    );
  };
  const removeLine = (productId) =>
    setLines((prev) => prev.filter((l) => l.productId !== productId));

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    for (const l of lines) {
      const lineSubtotal = l.price * l.quantity - (l.discount || 0);
      const lineTax = (lineSubtotal * l.taxRate) / 100;
      subtotal += l.price * l.quantity;
      totalDiscount += l.discount || 0;
      totalTax += lineTax;
    }
    const grandTotal = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, grandTotal };
  }, [lines]);

  const createInvoiceMutation = useMutation({
    mutationFn: () =>
      invoiceApi.create({
        customerId,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          serialNumber: l.serialNumber || undefined,
          discount: l.discount || 0,
        })),
        paymentMethod,
        amountPaid: totals.grandTotal,
      }),
    onSuccess: (res) => {
      toast.success("Invoice generated — warranty registered automatically");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate(`/app/invoices/${res.data.invoice._id}`);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to generate invoice"),
  });

  const canSubmit =
    customerId &&
    lines.length > 0 &&
    lines.every((l) => !l.serialNumberRequired || l.serialNumber);

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Scan or search products, then generate the invoice."
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-slate-700">
                Customer
              </label>
              <button
                type="button"
                onClick={() => setShowCustomerForm((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {showCustomerForm ? "Close form" : "New customer"}
              </button>
            </div>

            {customerId ? (
              <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm">
                <span>
                  {customersData?.data?.customers?.find(
                    (c) => c._id === customerId,
                  )?.name || "Selected customer"}
                </span>
                <button
                  onClick={() => setCustomerId("")}
                  className="text-xs text-brand-700 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search existing customer by name or phone…"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                {customerSearch && (
                  <div className="mt-2 max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                    {(customersData?.data?.customers || []).map((c) => (
                      <button
                        key={c._id}
                        onClick={() => {
                          setCustomerId(c._id);
                          setCustomerSearch("");
                        }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        {c.name} — {c.phone}
                      </button>
                    ))}
                    {!customersData?.data?.customers?.length && (
                      <p className="px-3 py-2 text-xs text-slate-400">
                        No matches
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {showCustomerForm && (
              <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <input
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Full name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <input
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Phone"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <input
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Email (optional)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={
                    createCustomerMutation.isPending ||
                    !newCustomer.name ||
                    !newCustomer.phone
                  }
                  onClick={() => createCustomerMutation.mutate(newCustomer)}
                  className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {createCustomerMutation.isPending
                    ? "Saving…"
                    : "Save & select customer"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Add product
            </label>
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search by name, SKU, or barcode…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {productSearch && (
              <div className="mt-2 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                {(productsData?.data?.products || []).map((p) => (
                  <button
                    key={p._id}
                    onClick={() => {
                      addProduct(p);
                      setProductSearch("");
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span>
                      {p.name} <span className="text-slate-400">({p.sku})</span>
                    </span>
                    <span className="flex items-center gap-2 text-slate-500">
                      ₹{p.price.toLocaleString()}{" "}
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
                {!productsData?.data?.products?.length && (
                  <p className="px-3 py-2 text-xs text-slate-400">No matches</p>
                )}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Qty</th>
                  <th className="px-4 py-2">Serial #</th>
                  <th className="px-4 py-2">Discount</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.map((l) => {
                  const lineSubtotal = l.price * l.quantity - (l.discount || 0);
                  const lineTotal =
                    lineSubtotal + (lineSubtotal * l.taxRate) / 100;
                  return (
                    <tr key={l.productId}>
                      <td className="px-4 py-2">{l.name}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={1}
                          value={l.quantity}
                          onChange={(e) =>
                            updateLine(l.productId, {
                              quantity: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="w-16 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={l.serialNumber}
                          onChange={(e) =>
                            updateLine(l.productId, {
                              serialNumber: e.target.value,
                            })
                          }
                          placeholder={
                            l.serialNumberRequired ? "Required" : "Optional"
                          }
                          className={`w-28 rounded border px-2 py-1 ${l.serialNumberRequired && !l.serialNumber ? "border-red-300" : "border-slate-300"}`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          value={l.discount}
                          onChange={(e) =>
                            updateLine(l.productId, {
                              discount: Number(e.target.value),
                            })
                          }
                          className="w-20 rounded border border-slate-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-2 font-medium">
                        ₹{lineTotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => removeLine(l.productId)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!lines.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-400"
                    >
                      Add products to start a bill.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShoppingCart className="h-4 w-4" /> Summary
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>-₹{totals.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>₹{totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <span>Grand Total</span>
                <span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <label className="mb-1 mt-4 block text-sm font-medium text-slate-700">
              Payment method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="NET_BANKING">Net Banking</option>
              <option value="WALLET">Wallet</option>
              <option value="OTHER">Other</option>
            </select>

            <button
              disabled={!canSubmit || createInvoiceMutation.isPending}
              onClick={() => createInvoiceMutation.mutate()}
              className="mt-4 w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {createInvoiceMutation.isPending
                ? "Generating…"
                : "Generate Bill & Register Warranty"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
