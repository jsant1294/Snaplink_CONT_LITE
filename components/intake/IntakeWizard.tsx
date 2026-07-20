"use client";

import { useMemo, useState } from "react";
import type { Contractor, ContactMethod, ProjectType } from "@/lib/types";
import { getQuestionSet, qLabel, qPlaceholder, type Question } from "@/lib/questions";
import { groupedServices, getService, serviceLabel, categoryLabel } from "@/lib/services";
import {
  t,
  optLabel,
  CONTACT_METHOD_OPTIONS,
  TIMELINE_OPTIONS,
  BUDGET_OPTIONS,
  type Lang,
} from "@/lib/i18n";

interface PhotoDraft {
  dataUrl: string;
  filename: string;
  kind: "current" | "inspiration" | "damage" | "other";
}

type Step = "type" | "questions" | "photos" | "contact" | "review" | "done";

async function compressImage(file: File, maxDim = 1200, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function IntakeWizard({
  contractor,
  intent,
  lang,
  onExit,
}: {
  contractor: Contractor;
  intent: "estimate" | "photos" | "walkthrough";
  lang: Lang;
  onExit: () => void;
}) {
  const [step, setStep] = useState<Step>("type");
  const [projectType, setProjectType] = useState<ProjectType | null>(null);
  // Answers stored with canonical EN question labels + EN option values,
  // so the contractor dashboard and AI pipeline stay consistent.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState({
    name: "",
    phone: "",
    email: "",
    projectAddress: "",
    preferredContact: "Text" as ContactMethod,
    bestTimeToContact: "",
    timeline: "",
    budgetRange: "",
    notes: intent === "walkthrough" ? t("walkthroughNote", lang) : "",
  });

  const allQuestions = useMemo<Question[]>(() => {
    if (!projectType) return [];
    const setKey = getService(projectType)?.questionSet ?? "generic";
    return getQuestionSet(setKey);
  }, [projectType]);
  const questions = useMemo(() => allQuestions.filter((q) => q.type !== "photos"), [allQuestions]);
  const photoPrompts = useMemo(() => allQuestions.filter((q) => q.type === "photos"), [allQuestions]);
  const serviceGroups = useMemo(() => groupedServices(contractor.services), [contractor.services]);

  async function handleFiles(files: FileList | null, kind: PhotoDraft["kind"]) {
    if (!files) return;
    const next: PhotoDraft[] = [];
    for (const file of Array.from(files).slice(0, 6 - photos.length)) {
      try {
        next.push({ dataUrl: await compressImage(file), filename: file.name, kind });
      } catch {
        setError(`${t("couldntRead", lang)} ${file.name}. ${t("tryDifferent", lang)}`);
      }
    }
    setPhotos((p) => [...p, ...next]);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contractor/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractorUsername: contractor.username,
          projectType,
          language: lang,
          answers,
          photos,
          ...contact,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? t("somethingWrong", lang));
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("somethingWrong", lang));
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = ["type", "questions", "photos", "contact", "review"].indexOf(step);

  return (
    <main className="min-h-screen max-w-md mx-auto px-5 pb-16 pt-8">
      <header className="mb-6">
        <button onClick={onExit} className="text-sm text-muted mb-3">
          ← {contractor.businessName}
        </button>
        {step !== "done" && (
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-gold" : "bg-white/10"}`}
              />
            ))}
          </div>
        )}
      </header>

      {error && (
        <div className="card border-danger/40 p-3 mb-4 text-sm text-danger">{error}</div>
      )}

      {/* STEP: project type */}
      {step === "type" && (
        <section>
          <h1 className="font-display text-3xl mb-1">{t("whatsTheProject", lang)}</h1>
          <p className="text-muted text-sm mb-5">{t("pickClosest", lang)}</p>
          <div className="space-y-5">
            {serviceGroups.map((g) => (
              <div key={g.category.id}>
                <p className="text-[11px] uppercase tracking-[0.2em] text-gold mb-2">
                  {categoryLabel(g.category.id, lang)}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {g.services.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => {
                        setProjectType(s.name);
                        setStep("questions");
                      }}
                      className={`card p-3.5 text-left text-sm font-medium ${projectType === s.name ? "border-gold" : ""}`}
                    >
                      {serviceLabel(s.name, lang)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STEP: dynamic questions */}
      {step === "questions" && projectType && (
        <section>
          <h1 className="font-display text-3xl mb-1">{serviceLabel(projectType, lang)}</h1>
          <p className="text-muted text-sm mb-5">{t("quickDetails", lang)}</p>
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id}>
                <label className="label">{qLabel(q, lang)}</label>
                {q.type === "select" ? (
                  <div className="flex flex-wrap gap-2">
                    {q.options!.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setAnswers((a) => ({ ...a, [q.label.en]: opt.value }))}
                        className={`px-3 py-2 rounded-lg text-sm border ${
                          answers[q.label.en] === opt.value
                            ? "bg-gold text-obsidian border-gold font-medium"
                            : "border-white/15 text-bone"
                        }`}
                      >
                        {optLabel(opt, lang)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    className="input"
                    placeholder={qPlaceholder(q, lang)}
                    value={answers[q.label.en] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.label.en]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setStep("photos")} className="btn-gold w-full mt-6">
            {t("continue", lang)}
          </button>
        </section>
      )}

      {/* STEP: photos */}
      {step === "photos" && (
        <section>
          <h1 className="font-display text-3xl mb-1">{t("addPhotos", lang)}</h1>
          <p className="text-muted text-sm mb-5">{t("photosHelp", lang)}</p>
          <div className="space-y-4">
            {(photoPrompts.length
              ? photoPrompts
              : ([{ id: "p", label: { en: "Upload photos", es: "Sube fotos" }, type: "photos", photoKind: "current" }] as Question[])
            ).map((q) => (
              <label key={q.id} className="card block p-4 cursor-pointer">
                <span className="text-sm font-medium">{qLabel(q, lang)}</span>
                <span className="block text-xs text-gold mt-1">{t("tapToAdd", lang)}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files, q.photoKind ?? "other")}
                />
              </label>
            ))}
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.dataUrl} alt={p.filename} className="rounded-lg aspect-square object-cover" />
                  <button
                    onClick={() => setPhotos((ph) => ph.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-obsidian/80 rounded-full w-6 h-6 text-xs"
                    aria-label={t("removePhoto", lang)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setStep("contact")} className="btn-gold w-full mt-6">
            {t("continue", lang)}
          </button>
        </section>
      )}

      {/* STEP: contact */}
      {step === "contact" && (
        <section>
          <h1 className="font-display text-3xl mb-1">{t("howReachYou", lang)}</h1>
          <p className="text-muted text-sm mb-5">{t("onlyFollowUp", lang)}</p>
          <div className="space-y-4">
            <div>
              <label className="label">{t("name", lang)}</label>
              <input className="input" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("phone", lang)}</label>
              <input className="input" type="tel" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("email", lang)}</label>
              <input className="input" type="email" inputMode="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            </div>
            <div>
              <label className="label">{t("projectAddress", lang)}</label>
              <input className="input" value={contact.projectAddress} onChange={(e) => setContact({ ...contact, projectAddress: e.target.value })} placeholder={t("addressPlaceholder", lang)} />
            </div>
            <div>
              <label className="label">{t("preferredContact", lang)}</label>
              <div className="flex flex-wrap gap-2">
                {CONTACT_METHOD_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setContact({ ...contact, preferredContact: m.value as ContactMethod })}
                    className={`px-3 py-2 rounded-lg text-sm border ${contact.preferredContact === m.value ? "bg-gold text-obsidian border-gold font-medium" : "border-white/15"}`}
                  >
                    {optLabel(m, lang)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">{t("bestTime", lang)}</label>
              <input className="input" value={contact.bestTimeToContact} onChange={(e) => setContact({ ...contact, bestTimeToContact: e.target.value })} placeholder={t("bestTimePlaceholder", lang)} />
            </div>
            <div>
              <label className="label">{t("timeline", lang)}</label>
              <div className="flex flex-wrap gap-2">
                {TIMELINE_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => setContact({ ...contact, timeline: o.value })} className={`px-3 py-2 rounded-lg text-sm border ${contact.timeline === o.value ? "bg-gold text-obsidian border-gold font-medium" : "border-white/15"}`}>
                    {optLabel(o, lang)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">{t("budgetRange", lang)}</label>
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => setContact({ ...contact, budgetRange: o.value })} className={`px-3 py-2 rounded-lg text-sm border ${contact.budgetRange === o.value ? "bg-gold text-obsidian border-gold font-medium" : "border-white/15"}`}>
                    {optLabel(o, lang)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">{t("anythingElse", lang)}</label>
              <textarea className="input min-h-[90px]" value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} />
            </div>
          </div>
          <button
            onClick={() => setStep("review")}
            disabled={!contact.name || !contact.phone}
            className="btn-gold w-full mt-6 disabled:opacity-40"
          >
            {t("reviewRequest", lang)}
          </button>
        </section>
      )}

      {/* STEP: review */}
      {step === "review" && (
        <section>
          <h1 className="font-display text-3xl mb-5">{t("reviewAndSend", lang)}</h1>
          <div className="card p-4 space-y-2 text-sm">
            <Row k={t("project", lang)} v={projectType ? serviceLabel(projectType, lang) : ""} />
            <Row k={t("name", lang).replace(" *", "")} v={contact.name} />
            <Row k={t("phone", lang).replace(" *", "")} v={contact.phone} />
            {contact.email && <Row k={t("email", lang)} v={contact.email} />}
            {contact.projectAddress && <Row k={t("projectAddress", lang)} v={contact.projectAddress} />}
            <Row
              k={t("contactVia", lang)}
              v={`${optLabel(CONTACT_METHOD_OPTIONS.find((m) => m.value === contact.preferredContact)!, lang)}${contact.bestTimeToContact ? ` · ${contact.bestTimeToContact}` : ""}`}
            />
            {contact.timeline && (
              <Row k={t("timeline", lang)} v={optLabel(TIMELINE_OPTIONS.find((o) => o.value === contact.timeline)!, lang)} />
            )}
            {contact.budgetRange && (
              <Row k={t("budgetRange", lang)} v={optLabel(BUDGET_OPTIONS.find((o) => o.value === contact.budgetRange)!, lang)} />
            )}
            {questions.map((q) => {
              const v = answers[q.label.en];
              if (!v) return null;
              const opt = q.options?.find((o) => o.value === v);
              return <Row key={q.id} k={qLabel(q, lang)} v={opt ? optLabel(opt, lang) : v} />;
            })}
            <Row k={t("photos", lang)} v={`${photos.length} ${t("attached", lang)}`} />
          </div>
          <button onClick={submit} disabled={submitting} className="btn-gold w-full mt-6 disabled:opacity-50">
            {submitting ? t("sending", lang) : `${t("sendTo", lang)} ${contractor.businessName}`}
          </button>
        </section>
      )}

      {/* STEP: done */}
      {step === "done" && (
        <section className="text-center pt-16">
          <p className="text-5xl mb-4">✓</p>
          <h1 className="font-display text-3xl mb-2">{t("requestSent", lang)}</h1>
          <p className="text-muted text-sm max-w-xs mx-auto mb-8">
            {contractor.businessName} {t("requestSentBody", lang)}{" "}
            {contact.bestTimeToContact ? `(${contact.bestTimeToContact.toLowerCase()})` : t("soon", lang)}.
          </p>
          <div className="space-y-3 max-w-xs mx-auto">
            <a href={`tel:${contractor.phone}`} className="btn-gold block">{t("callNow", lang)}</a>
            <button onClick={onExit} className="btn-outline w-full">{t("backToPage", lang)}</button>
          </div>
        </section>
      )}
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <span className="text-muted">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
