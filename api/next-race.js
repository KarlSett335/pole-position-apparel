import fs from "node:fs";
import path from "node:path";

export default function handler(req, res) {
    try {
        const filePath = path.join(process.cwd(), "data", "races.json");
        const raw = fs.readFileSync(filePath, "utf8");
        const races = JSON.parse(raw);

        const now = Date.now();
        const next = races
            .map(r => ({ ...r, t: new Date(r.iso).getTime() }))
            .filter(r => Number.isFinite(r.t))
            .filter(r => r.t > now)
            .sort((a, b) => a.t - b.t)[0];

        if (!next) {
            return res.status(404).json({ ok: false, error: "No hay próxima carrera en data/races.json" });
        }

        return res.status(200).json({
            ok: true,
            raceName: next.raceName,
            country: next.country || "",
            circuit: next.circuit || "",
            iso: next.iso
        });
    } catch (e) {
        return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
}
