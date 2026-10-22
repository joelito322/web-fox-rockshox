# CAPRA MK3 Carbon MX · v14

Corrección solicitada individualmente: acercar únicamente las llegadas superior/inferior a la pipa y sustituir el codo curvo genérico de la diagonal inmediata por una trayectoria más recta. Solo dos tallas del CAPRA, sobre sus capturas v13. Los otros catorce cuadros quedan intactos; no cambiar los bytes publicados v1–v13.

Referencia inspeccionada: lateral oficial MK3 MX en `models/catalog-v10/references/images/yt-capra-mk3-carbon-mx-3.png`, lateral v9 y [despiece oficial CAPRA MK3 Carbon](https://www.yt-industries.com/media/1c/a7/6f/1729759076/CAPRA-MK3-CF-29-MX-TECHNICAL_INFORMATION_CUSTOMER_210518.pdf?ts=1729759076). Se aprecia la diagonal principal recta y la ventana que se cierra hacia la dirección. No se declara nueva inspección de vídeo ni medidas deducidas como comerciales.

El constructor offline conserva cuerpo, pipa, pivotes, acabados y anclajes v13. Reemplaza las raíces dentro de un recorte local de 160 mm, con solape de 0,2 mm. Hasta 140 mm sigue el perfil anterior; en el extremo inferior utiliza una trayectoria recta, mientras el superior mantiene un empalme suave, con llegadas al 67 % y 43 % del eje de dirección (antes 74 % y 26 %). Son proporciones visuales estimadas, no cotas de fabricación. El cambio de forma queda limitado al contacto; no se estrecha globalmente el triángulo ni se reconstruye el resto de la diagonal.

Comprobar ambas tallas y caras, siete vistas generales y primeros planos, simetría de raíces, conservación fuera del recorte, pasos despejados y montaje con suspensión. Preparar/cargar `scripts/prepare-frame-v14.mjs --apply`; publicar solo después de revisión mediante fuente SQL acotada. La aceptación visual final sigue correspondiendo al usuario. Sin commits automáticos.

Estado: dos recursos publicados y verificados; 179 pruebas, build y tipos correctos, revisión de ambas tallas/montaje articulado y transición de guardados completadas. Auditoría remota de lectura correcta. Evidencia en [12i](../../docs/planning/12i-evidencia-capra-v14.md). No cambiar bytes de v14 publicada.
