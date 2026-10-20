# 06d · Administración de catálogo y prearmadas

Estado: composición aprobada explícitamente por el usuario el 19 de octubre de 2026: tablas y panel derecho, guardado de borrador y publicación separados. Implementación y pruebas funcionales pendientes. Reutiliza el patrón tabla/panel de 06c; no cambia Usuarios/Roles/Permisos ni sus permisos. Contratos de datos en 03a y operaciones en 04b.

```text
ATLAS MTB  / Administración                              Volver al trabajo
Catálogo   Bicicletas de referencia      Usuarios   Roles   Permisos

[Categoría v] [Marca v] [Buscar........................]    [+ Componente]
Modelo / marca       Variantes      Estado       Última acción disponible
FOX 38               ...            Borrador     Abrir

                                              PANEL DERECHO
                                              Nombre / Marca / Categoría
                                              Descripción y fuentes
                                              Variantes
                                              [ + Variante ]
                                              Versión / Medidas / Sistema
                                              Campos propios de categoría
                                              Acabados / Recurso existente
                                              Precio de referencia opcional
                                              [Guardar borrador] [Publicar]
```

En Bicicletas de referencia se conserva la tabla y el panel: nombre, marca, clase fábrica/ejemplo, fuentes, cuadro/talla y selección de variante/acabado por slot. Los errores se asocian al campo; no mostrar JSON crudo o identificadores internos en el recorrido normal. Los recursos solo se eligen de los existentes; sin subida de GLB desde la web.

Crear/corregir marcas es un panel pequeño reutilizando campos; no una navegación encadenada. Cambiar de registro con cambios ofrece guardar, descartar o cancelar. En móvil panel inferior ampliable, foco/teclado y guardado explícito. Retirar opciones conserva referencias previas. Versiones publicadas protegen interfaces/recursos; una corrección inmutable propone nueva variante.

La publicación es una acción separada autorizada; el permiso de edición no permite cambiar contenido público. No publicar hasta verificar datos obligatorios y representación. Confirmar resultado remoto, conservar borrador ante error y no presentar éxito ante fallo parcial.


El selector administrativo de una prearmada consulta borradores con el permiso `presets.manage`; el catálogo público y el configurador del ciclista conservan únicamente referencias publicadas. Una prearmada en borrador puede prepararse con variantes aún sin publicar. Publicar vuelve a exigir las 23 posiciones y sus marcas, modelos y recursos publicados. El guardado de borrador no concede permiso para publicar ni amplía la lectura pública.
