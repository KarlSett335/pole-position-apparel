module.exports = async (req, res) => {
    try {
        const r = await fetch("https://ergast.com/api/f1/current/next.json", {
            headers: { "User-Agent": "ppa-vercel" },
            cache: "no-store",
        });

        if (!r.ok) {
            return res.status(502).json({ ok: false, error: "Upstream HTTP " + r.status });
        }

        const data = await r.json();
        const race = data?.MRData?.RaceTable?.Races?.[0];

        if (!race) {
            return res.status(404).json({ ok: false, error: "No next race found" });
        }

        const time = race.time ? race.time : "00:00:00Z";
        const iso = `${race.date}T${time}`; // UTC

        return res.status(200).json({
            ok: true,
            raceName: race.raceName,
            country: race?.Circuit?.Location?.country || "",
            circuit: race?.Circuit?.circuitName || "",
            iso,
        });
    } catch (e) {
        console.error("Error in /api/next-race:", e);
        return res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
};
