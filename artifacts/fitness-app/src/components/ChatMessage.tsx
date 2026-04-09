const doctorImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%231e1b4b'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%23a78bfa'/%3E%3Crect x='24' y='46' width='32' height='20' rx='10' fill='%237c3aed'/%3E%3C/svg%3E";

interface Props {
  role: "user" | "coach";
  content: string;
}

function parseCoachMessage(text: string): React.ReactNode {
  const lines = text.split("\n").filter(l => l.trim() !== "" || true);
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      const heading = trimmed.replace(/^#+\s+/, "");
      nodes.push(
        <p key={i} className="text-xs font-bold uppercase tracking-wider text-violet-400 mt-3 mb-1 first:mt-0">
          {heading}
        </p>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length > 4) {
      const content = trimmed.slice(2, -2);
      nodes.push(
        <p key={i} className="text-sm font-bold text-cyan-300 mt-2 mb-0.5 leading-snug">
          {content}
        </p>
      );
      i++;
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const bulletItems: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        const bulletText = lines[i].trim().replace(/^[-*•]\s+/, "");
        bulletItems.push(
          <li key={i} className="flex gap-2 text-sm text-white/85 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-[7px] shrink-0" />
            <span>{formatInline(bulletText)}</span>
          </li>
        );
        i++;
      }
      nodes.push(<ul key={`ul-${i}`} className="space-y-1.5 mt-1">{bulletItems}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: React.ReactNode[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
        listItems.push(
          <li key={i} className="flex gap-2.5 text-sm text-white/85 leading-relaxed">
            <span className="w-5 h-5 rounded-full bg-violet-500/25 text-violet-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{num}</span>
            <span>{formatInline(itemText)}</span>
          </li>
        );
        num++;
        i++;
      }
      nodes.push(<ol key={`ol-${i}`} className="space-y-2 mt-1">{listItems}</ol>);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      const quoteText = trimmed.slice(2);
      nodes.push(
        <div key={i} className="border-l-2 border-cyan-500/60 pl-3 py-0.5 mt-2">
          <p className="text-sm text-cyan-200/90 italic leading-relaxed">{formatInline(quoteText)}</p>
        </div>
      );
      i++;
      continue;
    }

    nodes.push(
      <p key={i} className="text-sm text-white/85 leading-relaxed">
        {formatInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1.5">{nodes}</div>;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={idx} className="text-green-300">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={idx} className="text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return <span key={idx}>{part}</span>;
  });
}

export default function ChatMessage({ role, content }: Props) {
  if (role === "user") {
    return (
      <div className="flex flex-row-reverse gap-2.5">
        <div className="max-w-[82%] rounded-2xl rounded-tr-sm px-4 py-3 bg-violet-600 text-white text-sm leading-relaxed shadow-[0_0_16px_rgba(124,58,237,0.25)]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-xl overflow-hidden border border-violet-500/30 shrink-0 mt-0.5 shadow-[0_0_10px_rgba(124,58,237,0.25)]">
        <img src={doctorImg} alt="AI Coach" className="w-full h-full object-cover object-top" />
      </div>
      <div className="max-w-[82%] rounded-2xl rounded-tl-sm px-4 py-3 bg-white/[0.07] border border-white/[0.09]">
        {parseCoachMessage(content)}
      </div>
    </div>
  );
}
