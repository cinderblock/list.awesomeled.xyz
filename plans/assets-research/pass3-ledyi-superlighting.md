# Pass 3: maker-first check of LEDYi / Superlighting datasheet copies

Done 2026-11-27 4:49 PM PST (00:49Z). 24 entries whose `datasheet.url` was a LEDYi (media.ledyi.com) or
Superlighting LED copy. Nothing committed or staged. Checks: `bun run mirror-datasheets --check --only
pixel-ics/<id>` ok for all 7 changed entries (each served straight from the new `url`, no fallback);
`bun run validate` 609/609 valid; prettier and eslint clean on the changed files.

## Notes on sources

- **Titan Micro (titanmec.com).** The current site lists TM1803, TM1804, TM1809 (V1.8), TM1812 (V1.8), TM1814 (V1.1),
  TM1903 (V1.3) and TM1934 (V1.4); TM1829 and TM1914 are gone. All its PDFs are Chinese. Both the
  `/index/article/download.html?file=…` link and the decoded `/upload/twdz_cn/…pdf` path return the PDF **only with
  a titanmec.com `Referer`** (a 439-byte HTML 404 page otherwise, including when pasted into a browser), and none
  of the current files are in the Wayback Machine. The **old site** (`index.php/[en/](product|project)/download/id/N.html`,
  dead since ~2023) is well archived: I read the `Content-Disposition` filename of all 432 captures. Titan's old
  server prepends a UTF-8 BOM to every file; the mirror's `isPdf` allows that. Where the old capture and the
  current file are the same revision, they are byte-identical after the BOM (checked TM1803 V1.5, TM1814 V1.1).
  Only TM1829 has a Titan-made English edition (`TM1829_V1.5_EN.pdf`); the `/en/` download paths otherwise serve
  the Chinese files.
- **UCS (szucs.cn).** The live site's product pages (page136/140/144/148/151/159) are image-only; no PDFs or
  download area. Wayback holds 467 szucs.cn captures; the only documents are two 2015 Word `.doc` files under
  `/Upload/zh-cn/2015/9/` (one mentions UCS512/UCS512B; not PDFs, so unusable as `url`). No other UCS domain found;
  the datasheets themselves name no maker URL.
- **Sunmoon (chinaasic.com).** SM16716 is not in the live chip search (only SM16703…SM16719N). Wayback holds 89
  distinct `websiteManage/product/*.pdf` files (2020-2021 uploads, crawled 2023); I fetched all of them (live, or
  Wayback where the live copy is gone) and none is SM16716.
- **Worldsemi (world-semi.com).** Live catalog and both download paths (`/downloads/datasheets/en/`,
  `/web/userfiles/productfile/`) have WS2814A (SOP8, single input) V1.4 and WS2818B V1.5/V2.2, but not WS2814 or WS2818.
  Wayback: all 141 application/\* captures (old `/DownLoadFile/N` and `/uploads/soft/…` files included) checked; none
  is WS2814 or WS2818.
- **Genesis Systech** is 君略科技 at https://www.genesis-systech.com/ (GS8206 listed under serial drivers; GS8208 isn't,
  only GS8208C). The site has no PDFs ("contact us for documentation"), and its Wayback captures hold no documents.
- **Witop (witop-tech.com).** No CS8812 PDF on the live product or download pages, the 2018 archived CS8812B pages, or in
  Wayback's wp-content PDFs (5 files, none CS8812).

## Entries

| entry             | before host   | after                                                                                                           | reason / notes                                                                                                                                         |
| ----------------- | ------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| pixel-ics/fw1906  | LEDYi         | unchanged                                                                                                       | Maker unknown: the sheet names no company. Greeled's copy (gree-leds.com, Greeled-branded) is a vendor copy too.                                       |
| pixel-ics/gs8206  | LEDYi         | unchanged                                                                                                       | Genesis Systech site lists GS8206 but publishes no PDFs; nothing archived.                                                                             |
| pixel-ics/gs8208  | LEDYi         | unchanged                                                                                                       | Genesis Systech site has no GS8208 (only GS8208C) and no PDFs. Creator is right: the sheet's "Genesis Technology" is the same company.                 |
| pixel-ics/lb1908  | LEDYi         | unchanged                                                                                                       | Maker unknown (see data errors).                                                                                                                       |
| pixel-ics/sm16716 | LEDYi         | unchanged                                                                                                       | Not on chinaasic.com, live or archived.                                                                                                                |
| pixel-ics/tm1803  | LEDYi         | https://web.archive.org/web/20190220135348id_/http://www.titanmec.com:80/index.php/product/download/id/223.html | Titan V1.5 (Chinese), same file Titan serves today. LEDYi English (undated) kept as first source.                                                      |
| pixel-ics/tm1809  | LEDYi         | https://web.archive.org/web/20221004071520id_/http://titanmec.com/index.php/en/project/download/id/670.html     | Titan V1.6 (Chinese), the newest archived revision; live V1.8 is Referer-gated and unarchived.                                                         |
| pixel-ics/tm1812  | LEDYi         | https://web.archive.org/web/20221004071646id_/http://titanmec.com/index.php/en/project/download/id/672.html     | Titan V1.6 (Chinese), same revision as the LCSC source; live V1.8 gated. Added Titan's archived Chinese V1.4 as a manufacturer source.                 |
| pixel-ics/tm1829  | LEDYi         | https://web.archive.org/web/20221129143749id_/http://titanmec.com/index.php/en/project/download/id/664.html     | Titan's own English V1.5: the LEDYi file is this document with Titan's footers removed.                                                                |
| pixel-ics/tm1903  | LEDYi         | unchanged                                                                                                       | Only an older Titan V1.0 is archived. Titan's live V1.3 (Chinese, adds SOT23-8, like the LCSC source) is Referer-gated and unarchived.                 |
| pixel-ics/tm1934  | LEDYi         | https://web.archive.org/web/20200224201035id_/http://www.titanmec.com:80/index.php/project/download/id/680.html | Titan V1.0 (Chinese), same revision as the LEDYi English. Live V1.4 gated. Existing discrepancy kept: the Chinese V1.0 has the same mode-setting text. |
| pixel-ics/ucs512b | LEDYi         | unchanged                                                                                                       | szucs.cn hosts no PDFs, live or archived.                                                                                                              |
| pixel-ics/ucs5603 | LEDYi         | unchanged                                                                                                       | Same as ucs512b.                                                                                                                                       |
| pixel-ics/ucs7604 | LEDYi         | unchanged                                                                                                       | Same as ucs512b.                                                                                                                                       |
| pixel-ics/ucs8903 | LEDYi         | unchanged                                                                                                       | Same as ucs512b.                                                                                                                                       |
| pixel-ics/ucs8904 | LEDYi         | unchanged                                                                                                       | Same as ucs512b.                                                                                                                                       |
| pixel-ics/ucs9812 | LEDYi         | unchanged                                                                                                       | Same as ucs512b.                                                                                                                                       |
| pixel-ics/tm1814  | Superlighting | https://web.archive.org/web/20221004065449id_/http://titanmec.com/index.php/en/project/download/id/665.html     | Titan V1.1 (Chinese), same file Titan serves today. Superlighting English V1.0 kept as first source.                                                   |
| pixel-ics/tm1914  | Superlighting | https://web.archive.org/web/20200224201024id_/http://www.titanmec.com:80/index.php/project/download/id/678.html | Titan V1.2 (Chinese), same revision as the Superlighting English. TM1914 is off Titan's current site.                                                  |
| pixel-ics/ucs1903 | Superlighting | unchanged                                                                                                       | szucs.cn hosts no PDFs.                                                                                                                                |
| pixel-ics/ucs2903 | Superlighting | unchanged                                                                                                       | szucs.cn hosts no PDFs.                                                                                                                                |
| pixel-ics/ucs2904 | Superlighting | unchanged                                                                                                       | szucs.cn hosts no PDFs.                                                                                                                                |
| pixel-ics/ws2814  | Superlighting | unchanged                                                                                                       | Worldsemi only has WS2814A (SOP8, single DIN), a different variant from this SOP12 dual-input WS2814.                                                  |
| pixel-ics/ws2818  | Superlighting | unchanged                                                                                                       | Worldsemi only has WS2818B; nothing for the original WS2818, live or archived.                                                                         |
| pixels/cs8812     | Superlighting | unchanged                                                                                                       | Witop publishes no CS8812 PDF, live or archived.                                                                                                       |

## Suspected data errors / follow-ups (not changed)

- **Chinese maker sheets as `url`.** Six of the seven switches (all but tm1829) now point at Chinese Titan sheets,
  with the English vendor translations kept as the first `sources` entry. That follows the brief (maker copy of the
  same or a newer revision wins), but the site's primary link is now Chinese for those six entries.
- **tm1809**: the English LEDYi sheet gives 24 V outputs; Titan V1.6 (and the current V1.8) give **30 V** and
  add DIP14. The entry has no electrical fields, so nothing to correct; worth adding `output_voltage: 30V` from V1.6.
- **tm1803**: Titan V1.5 lists SOP8 and **DIP8**; the entry lists only SOP-8.
- **tm1934**: Titan V1.0 (Chinese) and V1.4 give a fixed **14 mA** in Features; the entry says 15 mA (14-16 mA,
  which likely comes from the electrical table). Check against the table before changing.
- **lb1908**: the English sheet's disclaimer reads "Titan Micro Electronics suggests…", so LB1908 is likely a
  relabelled Titan part (not checked which TM19xx it matches). The entry has no creator; nothing switched,
  since Titan publishes no LB1908.
- **cs8812**: Superlighting's CS8812 sheet carries Witop's contact address but "Genesis Technology" disclaimers, so the
  chip inside is probably a Genesis part (the entry's notes already say "Similar to GS8208").
- **Titan Referer gate**: if the mirror ever sends a `Referer: https://www.titanmec.com/`, Titan's current revisions
  (TM1809/TM1812 V1.8, TM1903 V1.3, TM1934 V1.4) become usable and would supersede the archived ones.
