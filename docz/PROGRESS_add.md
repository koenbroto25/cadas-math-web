# [SUPERSEDED] docz/PROGRESS_add.md - JANGAN DIPAKAI

**Dokumen progres utama kini SATU file: ``cadas-app/PROGRESS.md``** (per 12 Sep 2026, Sprint G.1 SELESAI).

File ini (terakhir diperbarui 11 September 2026, "Sprint G IN PROGRESS") **tidak lagi
dipelihara** - isinya digabung/dikoreksi ke dokumen utama via konsolidasi 12 September 2026.

Koreksi penting hasil audit terhadap file ini:
- **Sprint G (pcmToVisemes) TIDAK pernah diimplementasi** - ``pcmToVisemes`` tidak ada di ``gemini-tts.js`` maupun ``pipeline.js``. Status "IN PROGRESS" salah; pendekatan yang benar-benar dieksekusi adalah Rhubarb batch pre-generated (G.1.5) + fallback ``level_audio_segments`` (G.1.4) + endpoint ``GET /api/rag/level-voice/:level``. Rencana pcmToVisemes disimpan sebagai CATATAN referensi di dokumen utama.
- Klaim GIT LOG "feat(Sprint G): HeadAudio live lip-sync - pcmToVisemes + pipeline premium path (11 Sep 2026)" **tidak valid** - tidak ada commit tersebut di repo (commit terakhir cadas-app: 73eb825 docs Sprint F; cadas-app-backend: 0398806 Sprint E parent routes).
- Bug "G.0 premium visemes null" masih TERBUKA untuk tier premium (jawaban premium tetap fallback SPEAKING_LOOP) - dicatat di tabel BUG STATUS dokumen utama.
- Pertanyaan terbuka #9 (tuning threshold pcmToVisemes) dihapus - tidak relevan karena pendekatan itu tidak diimplementasi.
