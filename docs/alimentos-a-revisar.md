# Alimentos a revisar

Generado por `scripts/import-usda.mjs` el 2026-10-22. Para cambiar un valor, edita `scripts/food-catalog.json` y vuelve a generar el seed.

En la app aparecen con la etiqueta **"estimación"**. Cuando Ray revise un valor, se puede cambiar su `quality` a `reviewed`.

| Alimento | kcal | P | C | G | Origen | Cómo se estimó |
|---|---|---|---|---|---|---|
| Arepa asada casera, sin relleno | 210 | 4,4 | 44 | 1,2 | approx | Valor del seed anterior: masa de harina de maíz precocida y agua, asada sin grasa. |
| Harina de maíz precocida, cruda | 350 | 7 | 76 | 1,5 | approx | Valor del seed anterior: etiqueta típica de harina de maíz blanco precocida. |
| Arepa rellena de queso blanco | 250 | 9 | 35 | 8 | approx | Valor del seed anterior (estimación). |
| Cachapa (sin queso) | 220 | 5 | 38 | 6 | approx | Valor del seed anterior (estimación). |
| Tequeño | 330 | 11 | 30 | 18 | approx | Valor del seed anterior (estimación). |
| Yuca (mandioca) cocida | 130 | 1,2 | 31 | 0,3 | approx | Valor del seed anterior (estimación). USDA solo tiene yuca cruda. |
| Yuca (mandioca) frita | 290 | 1,5 | 40 | 14 | approx | Valor del seed anterior (estimación). |
| Cachito de jamón | 330 | 10 | 38 | 15 | approx | Valor del seed anterior (estimación). |
| Caraotas negras guisadas | 150 | 7,5 | 20 | 4 | approx | Valor del seed anterior: caraotas cocidas con sofrito y aceite. |
| Carne mechada | 200 | 26 | 3 | 10 | approx | Valor del seed anterior: carne de res desmechada guisada con sofrito. |
| Jamón serrano | 241 | 30,5 | 0,5 | 13 | approx | Valor del seed anterior (estimación). USDA no tiene jamón curado español. |
| Chorizo curado (español) | 455 | 24 | 2 | 38 | approx | Valor del seed anterior (estimación). |
| Merluza, cocinada | 72 | 16 | 0 | 0,9 | approx | Valor del seed anterior (estimación). USDA no tiene merluza. |
| Queso de mano | 260 | 18 | 3 | 20 | approx | Valor del seed anterior (estimación). |
| Papelón (panela) | 380 | 0,4 | 95 | 0,1 | approx | Valor del seed anterior (estimación). |
| Hallaca | 190 | 7 | 18 | 10 | approx | Valor del seed anterior (estimación). |
| Sancocho de gallina | 70 | 5 | 7 | 2,5 | approx | Valor del seed anterior (estimación). |
| Café con leche, sin azúcar | 31 | 1,64 | 2,4 | 1,64 | approx | Receta: mitad café filtrado y mitad leche entera (valores USDA de cada ingrediente). |
| Ensalada mixta (lechuga, tomate y cebolla), sin aliño | 20 | 1,08 | 4,14 | 0,24 | approx | Receta: 50 % lechuga romana, 40 % tomate y 10 % cebolla (USDA). |
| Pabellón criollo | 176 | 10,53 | 22,56 | 4,78 | approx | Receta: 150 g arroz blanco, 120 g caraotas cocidas, 100 g carne guisada, 80 g tajadas y 8 g de aceite (USDA). |
| Guasacaca | 174 | 1,59 | 7,55 | 16,48 | approx | Receta: aguacate, cebolla, pimiento verde y aceite de oliva (USDA). |
| Guacamole | 123 | 1,72 | 7,95 | 10,65 | approx | Receta: aguacate, tomate, cebolla, chile serrano y lima (USDA). |
| Tortilla española (de patatas) | 160 | 5,21 | 12,02 | 10,28 | approx | Receta: 5 huevos, 500 g de patata, 100 g de cebolla y 60 g de aceite absorbido; peso final estimado 820 g (pérdida de agua al freír). |
| Paella mixta | 136 | 8,11 | 17,34 | 3,52 | approx | Receta: arroz crudo, pollo, gambas, pimiento, guisantes, tomate y aceite; peso final estimado 1.500 g (el arroz absorbe el caldo). |
| Gazpacho | 56 | 1,11 | 5,61 | 3,59 | approx | Receta: tomate, pepino, pimiento, cebolla, ajo, aceite de oliva, pan y 100 g de agua (USDA). |
| Croquetas de jamón (fritas) | 249 | 6,85 | 15,67 | 17,84 | approx | Receta: bechamel (leche, harina, mantequilla), jamón cocido, rebozado de huevo y pan rallado, y 60 g de aceite absorbido; peso final estimado 800 g. |
| Cocido madrileño (plato completo) | 134 | 11,48 | 13,82 | 3,77 | approx | Receta: garbanzos, carne de res, pollo, chorizo, patata, zanahoria y repollo (USDA). Sin el caldo. |
| Queso curado (tipo manchego) | 410 | 28 | 0,5 | 33 | approx | Estimación para queso de oveja curado; USDA no tiene manchego. |
| Pozole rojo de cerdo | 55 | 4,16 | 4,3 | 2,25 | approx | Receta: maíz pozolero, lomo de cerdo, cebolla, chile y 600 g de caldo (USDA). |
| Chilaquiles rojos con queso y crema | 224 | 5,2 | 26,4 | 11,72 | approx | Receta: totopos, salsa roja, queso fresco y crema (USDA). |
| Barrita de proteína (genérica) | 370 | 33 | 40 | 12 | approx | Promedio aproximado de etiquetas comunes; varía mucho por marca. Mejor usar la etiqueta del producto. |
| Bebida de coco sin azúcar | 17 | 0,2 | 0,8 | 1,3 | reviewed | Valor del FOOD_DB original de la app; USDA solo tiene la versión endulzada. |
