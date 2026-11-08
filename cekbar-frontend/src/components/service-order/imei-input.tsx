import { useCallback, useRef, useEffect, useState } from "react";
import { Clipboard, Check } from "lucide-react";
import { parseIMEIList } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ImeiInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
};

export function ImeiInput({ value, onChange, label, disabled }: ImeiInputProps) {
  const { all, valid, invalid } = parseIMEIList(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const MAX_LINES = 10;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const filtered = e.target.value.replace(/[^\d\n]/g, "");
      const limited = filtered.split("\n").slice(0, MAX_LINES).join("\n");
      onChange(limited);
    },
    [onChange]
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.max(100, textareaRef.current.scrollHeight) + "px";
    }
  }, [value]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        const filtered = text.replace(/[^\d\n]/g, "");
        const combined = value ? value.trim() + "\n" + filtered.trim() : filtered.trim();
        const limited = combined.split("\n").slice(0, MAX_LINES).join("\n");
        onChange(limited);
      }
    } catch {
    }
  };

  const handleClear = () => onChange("");

  function lineStatus(line: string): "valid" | "invalid" | "empty" {
    if (!line.trim()) return "empty";
    return /^\d{15}$/.test(line.trim()) ? "valid" : "invalid";
  }

  function invalidDetail(line: string): string {
    const t = line.trim();
    if (t.length < 15) return `kurang ${15 - t.length} digit (${t.length}/15)`;
    if (t.length > 15) return `kelebihan ${t.length - 15} digit (${t.length}/15)`;
    if (!/^\d+$/.test(t)) return "hanya angka";
    return "format salah";
  }

  const lines = value.split("\n").filter((l) => l.trim().length > 0);

  return (
    <div className="space-y-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <p className="text-sm text-muted-foreground">
          Satu IMEI per baris, 15 digit (maks. {MAX_LINES} IMEI)
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePaste}
            type="button"
            disabled={disabled}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-card border border-border px-3 py-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Clipboard size={13} />
            Tempel
          </button>
          {value.trim() && (
            <button
              onClick={handleClear}
              type="button"
              disabled={disabled}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 bg-card border border-border px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-40"
            >
              Kosongkan
            </button>
          )}
        </div>
      </div>

      {lines.length > 0 && (
        <div className="border border-border rounded-xl divide-y divide-border mb-3 overflow-hidden">
          {lines.map((line, i) => {
            const status = lineStatus(line);
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                  status === "invalid" ? "bg-red-50/50 dark:bg-red-950/10" : "bg-card"
                )}
              >
                <span className="text-xs text-muted-foreground/50 w-6 text-right font-mono shrink-0">{i + 1}</span>
                <span className={cn(
                  "font-mono flex-1 tracking-wide",
                  status === "invalid" ? "text-red-500" : "text-foreground"
                )}>
                  {line.trim()}
                </span>
                {status === "valid" && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                    <Check size={12} /> valid
                  </span>
                )}
                {status === "invalid" && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-medium shrink-0 whitespace-nowrap">
                    {invalidDetail(line)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div
        className={cn(
          "relative rounded-xl border transition-all duration-200",
          focused
            ? "border-blue-500 ring-2 ring-blue-500/10"
            : "border-border"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className="w-full rounded-xl bg-transparent text-foreground text-sm px-4 py-3
                     placeholder:text-muted-foreground/40
                     focus:outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed
                     font-mono resize-none"
          placeholder={lines.length >= MAX_LINES ? `Maks. ${MAX_LINES} IMEI tercapai` : "Ketik IMEI berikutnya, lalu Enter"}
          readOnly={lines.length >= MAX_LINES}
          inputMode="numeric"
        />
      </div>
    </div>
  );
}
