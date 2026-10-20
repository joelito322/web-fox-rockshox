# Referencias de los perfiles v3

Fecha de revisión: 19–20 de octubre de 2026. Cobertura geométrica: 53 modelos, 128 capturas de variante. Las cotas comerciales proceden de las fichas ya documentadas; secciones, pequeñas piezas y superficies exteriores siguen siendo aproximaciones. La cobertura no equivale a un parecido certificado del 90 %.

## Referencias audiovisuales revisadas

- [FOX 40 · vídeo enlazado desde la página oficial](https://www.youtube.com/watch?v=ZrFBbpLDbM0), localizado en [FOX 40](https://ridefox.com/pages/fox-40). Descarga temporal de 720p para revisión; contacto de fotogramas a 0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120 y 132 s. Se observaron presentación exterior de la doble pletina, mandos azules, barras doradas y puente. Los cortes de interior explicativos no se modelan como piezas exteriores. No prueba las cotas de otros modelos.

- [SUPREME DH V5 · vídeo de su portada oficial](https://www.youtube.com/watch?v=fT5wl_dbj60), enlazado en [COMMENCAL](https://www.commencal.com/ca/en/landing-supreme-dh-v5.html). Revisado con muestras a 0/4/8/12/16/20 s: predominan carrera y resultados deportivos; **no aporta detalle suficiente para validar geometría**. El perfil se apoya en la foto del cuadro y sus anclajes documentados. No se atribuye a todos los modelos una revisión de vídeo.

Los vídeos y contactos temporales se conservan en `/tmp/atlas-model-reference-video/` durante esta sesión; no se incluyen vídeos completos de terceros en el repositorio ni en el producto. Para reproducir: `yt-dlp -f "bestvideo[height<=720][ext=mp4]" URL`, y `ffmpeg -i video.mp4 -vf "fps=1/12,scale=400:-1,tile=4x3" -frames:v 1 contacto.jpg` para FOX.

## Inventario y grado de referencia

| Perfil inmutable | Categoría | Fuente exterior | Límite |
| --- | --- | --- | --- |
| `commencal-meta-sx-v5` | frame | [Referencia](https://www.commencal.com/en/bikes/frames%20%2F%20a%20la%20carte/enduro/meta%20sx%20v5/FT3MSXV5TMEXL.html?lang=en_FR) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `ohlins-rxf38-m3` | fork | [Referencia](https://www.ohlins.com/en-it/mountain-bike/front-forks/am-rxf38-m-3-air-ttx18-29-44-170) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `fox-38-factory-my27` | fork | [Referencia](https://ridefox.com/products/my27-fox-38-factory) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `rockshox-vivid-coil-ultimate-d1` | shock | [Referencia](https://www.sram.com/en/rockshox/models/rs-vivc-ult-d1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `marzocchi-bomber-cr` | shock | [Referencia](https://bike.marzocchi.com/products/bomber-cr-rear-shock) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `shimano-slx-m7120` | brake | [Referencia](https://productinfo.shimano.com/en/product/BR-M7120) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `shimano-slx-oem-165-32` | crankset | [Referencia](https://www.commencal.com/us/en/bikes/bikes/enduro/meta%20sx%20v5/BT5MSXV5EEU1S.html?lang=en_US) | Cotas OEM documentadas; identidad comercial exacta de biela no certificada. |
| `shimano-sm-bb71-41a` | bottom_bracket | [Referencia](https://bike.shimano.com/en-UK/products/components/pdp.P-SM-BB71-41A.html) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `shimano-slx-rd-m7100-sgs` | rear_derailleur | [Referencia](https://productinfo.shimano.com/en/product/RD-M7100-SGS) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `shimano-slx-cs-m7100-12` | cassette | [Referencia](https://productinfo.shimano.com/index.html/spec/mtb-cassette) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `shimano-slx-cn-m7100` | chain | [Referencia](https://productinfo.shimano.com/en/product/CN-M7100) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `shimano-sm-rt86` | rotor | [Referencia](https://probike.co.th/products/sm-disc-brake-rotor-sm-rt86-180mm-x2-6-boltsshimano) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `dt-swiss-e-593` | rim | [Referencia](https://www.dtswiss.com/en/components/rims-mtb/enduro/e-593) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `dt-swiss-350` | hub | [Referencia](https://www.dtswiss.com/en/components/hubs-and-rws/hubs-mtb/350) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `maxxis-assegai` | tire | [Referencia](https://www.maxxis.com/us/tire/assegai/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `maxxis-minion-dhr-ii` | tire | [Referencia](https://www.maxxis.com/int/tire/minion-dhr-ii/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `rockbros-nylon-2017-12` | pedals | [Referencia](https://rockbrosusa.com/products/rockbros-mtb-pedals-mountain-bike-pedals-lightweight-nylon-fiber-bicycle-platform-pedals-for-bmx-mtb-9-16) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `atlas-handlebar-v1` | handlebar | Diseño ATLAS | Diseño genérico propio, sin réplica de marca. |
| `atlas-stem-v1` | stem | Diseño ATLAS | Diseño genérico propio, sin réplica de marca. |
| `atlas-saddle-v1` | saddle | Diseño ATLAS | Diseño genérico propio, sin réplica de marca. |
| `atlas-seatpost-v1` | seatpost | Diseño ATLAS | Diseño genérico propio, sin réplica de marca. |
| `commencal-supreme-dh-v5` | frame | [Referencia](https://www.commencal.com/fr/bikes/cadres%20%2F%20a%20la%20carte/downhill/supreme%20dh%20v5/FT3SUPV54M.html?lang=fr_FR) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `fox-40-factory-my27` | fork | [Referencia](https://ridefox.com/products/my27-fox-40-factory) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `sram-gx-dh-a3` | rear_derailleur | [Referencia](https://www.sram.com/en/sram/models/rd-gx-1dh-a3) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `sram-xg-795` | cassette | [Referencia](https://www.sram.com/en/sram/models/cs-xg-795-a1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `sram-pc1110` | chain | [Referencia](https://www.sram.com/en/sram/models/cn-1110-a1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `sram-dub-pressfit` | bottom_bracket | [Referencia](https://www.sram.com/en/sram/models/bb-dub-pf-a1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `truvativ-descendant-dh` | crankset | [Referencia](https://www.sram.com/en/truvativ/models/fc-desc-dh-b1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `atlas-potencia-directa` | stem | Diseño ATLAS | Diseño genérico propio, sin réplica de marca. |
| `shimano-slx-m7100-brake` | brake | [Referencia](https://productinfo.shimano.com/en/product/BR-M7100) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `magura-mt4` | brake | [Referencia](https://magura.com/product/mt4/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `magura-mt5` | brake | [Referencia](https://magura.com/product/mt5/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `magura-mt5-pro` | brake | [Referencia](https://magura.com/product/mt5-pro/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `magura-mt7-pro` | brake | [Referencia](https://magura.com/product/mt7-pro/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `sram-maven-brz-b1` | brake | [Referencia](https://www.sram.com/en/sram/models/db-mvn-brz-b1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `sram-maven-slv-b1` | brake | [Referencia](https://www.sram.com/en/sram/models/db-mvn-slv-b1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `sram-maven-ult-b1` | brake | [Referencia](https://www.sram.com/en/sram/models/db-mvn-ult-b1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `magura-mdr-p` | rotor | [Referencia](https://magura.com/product/mdr-p/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `sram-hs2` | rotor | [Referencia](https://www.sram.com/en/sram/models/rt-hs-2-a1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `rockshox-zeb-ultimate-b1` | fork | [Referencia](https://www.sram.com/en/rockshox/models/fs-zeb-ult-b1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `marzocchi-bomber-z1-rail` | fork | [Referencia](https://bike.marzocchi.com/products/bomber-z1) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `fox-float-x2-factory-my26` | shock | [Referencia](https://ridefox.com/products/float-x2-factory) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `ohlins-ttx22m2-coil` | shock | [Referencia](https://www.ohlins.com/en-us/mountain-bike/rear-shocks/ttx22m-2-coil-230x65-am) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `santa-cruz-nomad-7-my27` | frame | [Referencia](https://www.tribestore.it/shop/nomad-7-cc-frameset-my27-3615) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `canyon-sender-cfr-high-pivot` | frame | [Referencia](https://www.canyon.com/en-gb/mountain-bikes/downhill-bikes/sender/sender-cfr/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `specialized-s-works-enduro-udh` | frame | [Referencia](https://www.specialized.com/qa/en/s-works-enduro-frameset/p/4276009) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `da-bomb-cherry-bomb-29` | frame | [Referencia](https://www.dabombmtb.com/product_detail/CherryBomb29/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `scott-ransom-rc-427727` | frame | [Referencia](https://www.scott-sports.com/global/en/product/scott-ransom-rc-frame-shock) | Envolvente integrada aproximada; foto del artículo exacto pendiente. Interior no reconstruido. |
| `trek-slash-al-gen-6` | frame | [Referencia](https://www.trekbikes.com/us/en_US/bikes/mountain-bikes/trail-mountain-bikes/slash/f/F341/slash-al-gen-6-frameset/42271/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `cst-bft-c1752` | tire | [Referencia](https://csttires.eu/bft/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `kenda-pinner-pro-k1241a` | tire | [Referencia](https://bicycle.kendatire.com/en-us/find-a-tire/bicycle/all-mountain-trail/pinner-pro/) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `michelin-wild-enduro-ms-racing-line` | tire | [Referencia](https://www.michelin.co.uk/bicycle/tyres/michelin-wild-enduro-ms-racing-line) | Aproximación exterior; detalles y reverso sin validación CAD. |
| `schwalbe-gravity-magic-mary` | tire | [Referencia](https://www.schwalbe.com/en/GRAVITY-Magic-Mary-11654688) | Aproximación exterior; detalles y reverso sin validación CAD. |

Las fotos de familia no prueban el acabado exacto de cada SKU. La representación original `generic`/`approximate` se conserva: añadir un perfil no transforma la variante en una reproducción exacta ni modifica su compatibilidad mecánica.

Aceptación: todos los recursos deben cargar y responder a selección/pintura/guardado; el parecido se revisa por vistas y referencias disponibles. Las incertidumbres de artículo, reverso o generación permanecen identificadas hasta contar con evidencia suficiente.


## Uso en v4

Los mismos perfiles y referencias se reutilizan en v4. La corrección orienta las secciones en los tres ejes para conservar volumen transversal; no añade medidas comerciales verificadas ni elimina las limitaciones indicadas por modelo. V3 se conserva para sus capturas guardadas.
