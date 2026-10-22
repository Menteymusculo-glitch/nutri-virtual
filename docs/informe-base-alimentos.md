# Informe de la base de alimentos internacional

Generado por `scripts/import-usda.mjs` el 2026-10-22. No lo edites a mano.

Fuente de los valores: USDA FoodData Central (FoodData_Central_sr_legacy_food_csv_2018-04, FoodData_Central_foundation_food_csv_2026-04-30), dominio público (CC0 1.0).

**349 alimentos** y **387 porciones caseras**.

## Por región

Un alimento puede contar en varias regiones.

| Región | Alimentos |
|---|---|
| ES | 273 |
| EU | 272 |
| US | 315 |
| MX | 303 |
| VE | 296 |
| LATAM | 303 |

## Por calidad del dato

| quality | Alimentos | Qué significa |
|---|---|---|
| usda | 317 | Valor oficial de USDA, sin tocar |
| approx | 31 | Estimación (receta con ingredientes USDA o valor manual): pendiente de revisión |
| reviewed | 1 | Valor del FOOD_DB original de la app |

## Por estado de preparación

| prep_state | Alimentos |
|---|---|
| a_la_plancha | 6 |
| bebida | 31 |
| cocido | 61 |
| crudo | 111 |
| envasado | 68 |
| frito | 20 |
| horneado | 31 |
| otro | 21 |

## Lo que no se encontró en USDA

Estos platos o productos no existen en SR Legacy ni en Foundation; quedan con `quality = 'approx'`.

| Alimento | Cómo se estimó |
|---|---|
| Arepa asada casera, sin relleno | Valor del seed anterior: masa de harina de maíz precocida y agua, asada sin grasa. |
| Harina de maíz precocida, cruda | Valor del seed anterior: etiqueta típica de harina de maíz blanco precocida. |
| Arepa rellena de queso blanco | Valor del seed anterior (estimación). |
| Cachapa (sin queso) | Valor del seed anterior (estimación). |
| Tequeño | Valor del seed anterior (estimación). |
| Yuca (mandioca) cocida | Valor del seed anterior (estimación). USDA solo tiene yuca cruda. |
| Yuca (mandioca) frita | Valor del seed anterior (estimación). |
| Cachito de jamón | Valor del seed anterior (estimación). |
| Caraotas negras guisadas | Valor del seed anterior: caraotas cocidas con sofrito y aceite. |
| Carne mechada | Valor del seed anterior: carne de res desmechada guisada con sofrito. |
| Jamón serrano | Valor del seed anterior (estimación). USDA no tiene jamón curado español. |
| Chorizo curado (español) | Valor del seed anterior (estimación). |
| Merluza, cocinada | Valor del seed anterior (estimación). USDA no tiene merluza. |
| Queso de mano | Valor del seed anterior (estimación). |
| Papelón (panela) | Valor del seed anterior (estimación). |
| Hallaca | Valor del seed anterior (estimación). |
| Sancocho de gallina | Valor del seed anterior (estimación). |
| Café con leche, sin azúcar | Receta: mitad café filtrado y mitad leche entera (valores USDA de cada ingrediente). |
| Ensalada mixta (lechuga, tomate y cebolla), sin aliño | Receta: 50 % lechuga romana, 40 % tomate y 10 % cebolla (USDA). |
| Pabellón criollo | Receta: 150 g arroz blanco, 120 g caraotas cocidas, 100 g carne guisada, 80 g tajadas y 8 g de aceite (USDA). |
| Guasacaca | Receta: aguacate, cebolla, pimiento verde y aceite de oliva (USDA). |
| Guacamole | Receta: aguacate, tomate, cebolla, chile serrano y lima (USDA). |
| Tortilla española (de patatas) | Receta: 5 huevos, 500 g de patata, 100 g de cebolla y 60 g de aceite absorbido; peso final estimado 820 g (pérdida de agua al freír). |
| Paella mixta | Receta: arroz crudo, pollo, gambas, pimiento, guisantes, tomate y aceite; peso final estimado 1.500 g (el arroz absorbe el caldo). |
| Gazpacho | Receta: tomate, pepino, pimiento, cebolla, ajo, aceite de oliva, pan y 100 g de agua (USDA). |
| Croquetas de jamón (fritas) | Receta: bechamel (leche, harina, mantequilla), jamón cocido, rebozado de huevo y pan rallado, y 60 g de aceite absorbido; peso final estimado 800 g. |
| Cocido madrileño (plato completo) | Receta: garbanzos, carne de res, pollo, chorizo, patata, zanahoria y repollo (USDA). Sin el caldo. |
| Queso curado (tipo manchego) | Estimación para queso de oveja curado; USDA no tiene manchego. |
| Pozole rojo de cerdo | Receta: maíz pozolero, lomo de cerdo, cebolla, chile y 600 g de caldo (USDA). |
| Chilaquiles rojos con queso y crema | Receta: totopos, salsa roja, queso fresco y crema (USDA). |
| Barrita de proteína (genérica) | Promedio aproximado de etiquetas comunes; varía mucho por marca. Mejor usar la etiqueta del producto. |
| Bebida de coco sin azúcar | Valor del FOOD_DB original de la app; USDA solo tiene la versión endulzada. |

## Validación kcal ≈ 4·P + 4·C + 9·G

Se marca una fila si se desvía más de un 20 % y más de 5 kcal. La kcal guardada es siempre la de la fuente.

Ninguna fila excluida.

Con desviación explicada (se conservan):

| Alimento | kcal fuente | kcal por macros | Desviación | Motivo |
|---|---|---|---|---|
| Brócoli, crudo | 34 | 41,2 | +21,1 % | Verdura con mucha fibra para sus pocas calorías: USDA calcula la energía con factores de Atwater específicos y la fibra apenas aporta kcal. |
| Espinaca, cruda | 23 | 29,5 | +28,1 % | Verdura con mucha fibra para sus pocas calorías: USDA calcula la energía con factores de Atwater específicos y la fibra apenas aporta kcal. |
| Espinaca cocida | 23 | 29,2 | +27 % | Verdura con mucha fibra para sus pocas calorías: USDA calcula la energía con factores de Atwater específicos y la fibra apenas aporta kcal. |
| Champiñones, crudos | 22 | 28,5 | +29,4 % | Verdura con mucha fibra para sus pocas calorías: USDA calcula la energía con factores de Atwater específicos y la fibra apenas aporta kcal. |
| Champiñones cocidos | 28 | 34,1 | +21,7 % | Verdura con mucha fibra para sus pocas calorías: USDA calcula la energía con factores de Atwater específicos y la fibra apenas aporta kcal. |
| Espárragos, crudos | 20 | 25,4 | +27 % | Verdura con mucha fibra para sus pocas calorías: USDA calcula la energía con factores de Atwater específicos y la fibra apenas aporta kcal. |
| Espárragos cocidos | 22 | 28 | +27,4 % | Verdura con mucha fibra para sus pocas calorías: USDA calcula la energía con factores de Atwater específicos y la fibra apenas aporta kcal. |
| Kale (col rizada), cruda | 35 | 42,8 | +22,2 % | Verdura con mucha fibra para sus pocas calorías: USDA calcula la energía con factores de Atwater específicos y la fibra apenas aporta kcal. |
| Coliflor | 25 | 30,1 | +20,3 % | Verdura con mucha fibra para sus pocas calorías: USDA calcula la energía con factores de Atwater específicos y la fibra apenas aporta kcal. |
| Limón amarillo (sin cáscara) | 29 | 44,4 | +53 % | Cítrico ácido: los carbohidratos «por diferencia» incluyen fibra y ácido cítrico, que aportan menos de 4 kcal/g. |
| Lima (limón verde) | 30 | 46,8 | +55,9 % | Cítrico ácido: los carbohidratos «por diferencia» incluyen fibra y ácido cítrico, que aportan menos de 4 kcal/g. |
| Cerveza | 43 | 16 | -62,7 % | Bebida alcohólica: el alcohol (7 kcal/g) no figura en los macros. |
| Cerveza light | 29 | 7,5 | -74,1 % | Bebida alcohólica: el alcohol (7 kcal/g) no figura en los macros. |
| Vino tinto | 85 | 10,7 | -87,4 % | Bebida alcohólica: el alcohol (7 kcal/g) no figura en los macros. |
| Vino blanco | 82 | 10,7 | -87 % | Bebida alcohólica: el alcohol (7 kcal/g) no figura en los macros. |
| Licor destilado (ron, vodka, whisky, ginebra) | 250 | 0,4 | -99,8 % | Bebida alcohólica: el alcohol (7 kcal/g) no figura en los macros. |

## Correspondencia con USDA

Para revisar que cada nombre en español describe el alimento correcto (y su estado crudo/cocido).

| Nombre | Estado | fdcId | Descripción USDA |
|---|---|---|---|
| Huevo entero, crudo | crudo | 171287 | Egg, whole, raw, fresh |
| Huevo duro (cocido) | cocido | 173424 | Egg, whole, cooked, hard-boiled |
| Huevo frito | frito | 173423 | Egg, whole, cooked, fried |
| Huevo revuelto | cocido | 172187 | Egg, whole, cooked, scrambled |
| Tortilla francesa (omelet) | cocido | 172185 | Egg, whole, cooked, omelet |
| Clara de huevo, cruda | crudo | 172183 | Egg, white, raw, fresh |
| Pechuga de pollo sin piel, cruda | crudo | 171077 | Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw |
| Pechuga de pollo a la plancha, sin piel | a_la_plancha | 171534 | Chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, grilled |
| Pechuga de pollo al horno, sin piel | horneado | 171477 | Chicken, broilers or fryers, breast, meat only, cooked, roasted |
| Pollo desmechado (pechuga guisada sin piel) | cocido | 171478 | Chicken, broilers or fryers, breast, meat only, cooked, stewed |
| Pollo guisado, solo carne | cocido | 171451 | Chicken, broilers or fryers, meat only, cooked, stewed |
| Pollo, solo carne, crudo | crudo | 171052 | Chicken, broilers or fryers, meat only, raw |
| Pollo asado con piel | horneado | 171450 | Chicken, broilers or fryers, meat and skin, cooked, roasted |
| Muslo de pollo sin piel, asado | horneado | 172388 | Chicken, broilers or fryers, thigh, meat only, cooked, roasted |
| Alas de pollo asadas, con piel | horneado | 173630 | Chicken, broilers or fryers, wing, meat and skin, cooked, roasted |
| Pechuga de pollo frita, sin empanizar | frito | 171078 | Chicken, broilers or fryers, breast, meat only, cooked, fried |
| Pollo frito empanizado (pechuga, comida rápida) | frito | 170756 | Fast Foods, Fried Chicken, Breast, meat and skin and breading |
| Tiras de pollo empanizadas (comida rápida) | frito | 173321 | Fast foods, chicken tenders |
| Carne molida de pollo, cruda | crudo | 171116 | Chicken, ground, raw |
| Pechuga de pavo, cruda | crudo | 171098 | Turkey, whole, breast, meat only, raw |
| Pechuga de pavo asada | horneado | 171496 | Turkey, whole, breast, meat only, cooked, roasted |
| Pechuga de pavo en lonchas (fiambre) | envasado | 172941 | Turkey breast, sliced, prepackaged |
| Carne molida de pavo, cocida | cocido | 171506 | Turkey, Ground, cooked |
| Carne molida de pavo, cruda | crudo | 171505 | Turkey, Ground, raw |
| Carne de res magra (solomillo), cruda | crudo | 171804 | Beef, top sirloin, steak, separable lean only, trimmed to 1/8" fat, select, raw |
| Bistec de res magro a la plancha | a_la_plancha | 174054 | Beef, top sirloin, steak, separable lean only, trimmed to 1/8" fat, all grades, cooked, broiled |
| Carne molida de res 95 % magra, cruda | crudo | 171790 | Beef, ground, 95% lean meat / 5% fat, raw |
| Carne molida de res 90 % magra, cruda | crudo | 174030 | Beef, ground, 90% lean meat / 10% fat, raw |
| Carne molida de res 85 % magra, cocida | a_la_plancha | 174032 | Beef, ground, 85% lean meat / 15% fat, patty, cooked, broiled |
| Carne de res para guisar, guisada | cocido | 171203 | Beef, chuck for stew, separable lean and fat, all grades, cooked, braised |
| Falda de res (flank), cruda | crudo | 168609 | Beef, flank, steak, separable lean only, trimmed to 0" fat, choice, raw |
| Lomo de cerdo (solomillo) asado | horneado | 167905 | Pork, fresh, loin, tenderloin, separable lean and fat, cooked, roasted |
| Lomo de cerdo (solomillo), crudo | crudo | 168249 | Pork, fresh, loin, tenderloin, separable lean only, raw |
| Chuleta de cerdo a la parrilla | a_la_plancha | 167827 | Pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, cooked, broiled |
| Jamón cocido en lonchas | envasado | 173864 | Ham, sliced, regular (approximately 11% fat) |
| Tocino (bacon) frito | frito | 168322 | Pork, cured, bacon, pre-sliced, cooked, pan-fried |
| Chorizo fresco (mexicano), crudo | crudo | 173859 | Sausage, pork, chorizo, link or ground, raw |
| Salchicha tipo frankfurt, caliente | cocido | 174615 | Frankfurter, meat, heated |
| Salmón atlántico de piscifactoría, crudo | crudo | 175167 | Fish, salmon, Atlantic, farmed, raw |
| Salmón atlántico de piscifactoría, cocinado | horneado | 175168 | Fish, salmon, Atlantic, farmed, cooked, dry heat |
| Atún fresco (aleta amarilla), crudo | crudo | 175159 | Fish, tuna, fresh, yellowfin, raw |
| Atún al natural (en agua), escurrido | envasado | 171986 | Fish, tuna, light, canned in water, without salt, drained solids |
| Atún en aceite, escurrido | envasado | 173708 | Fish, tuna, light, canned in oil, drained solids |
| Tilapia, cruda | crudo | 175176 | Fish, tilapia, raw |
| Tilapia cocinada | horneado | 175177 | Fish, tilapia, cooked, dry heat |
| Bacalao fresco, crudo | crudo | 171955 | Fish, cod, Atlantic, raw |
| Bacalao fresco, cocinado | horneado | 175178 | Fish, cod, Pacific, cooked |
| Eglefino (pescado blanco), crudo | crudo | 171964 | Fish, haddock, raw |
| Caballa, cruda | crudo | 175119 | Fish, mackerel, Atlantic, raw |
| Sardinas en aceite, escurridas | envasado | 175139 | Fish, sardine, Atlantic, canned in oil, drained solids with bone |
| Camarón (gamba), crudo | crudo | 175179 | Crustaceans, shrimp, raw |
| Camarón (gamba) cocido | cocido | 175180 | Crustaceans, shrimp, cooked |
| Calamar, crudo | crudo | 174223 | Mollusks, squid, mixed species, raw |
| Calamares fritos (rebozados) | frito | 171982 | Mollusks, squid, mixed species, cooked, fried |
| Pulpo, crudo | crudo | 174218 | Mollusks, octopus, common, raw |
| Mejillones cocidos | cocido | 174217 | Mollusks, mussel, blue, cooked, moist heat |
| Leche entera | bebida | 171265 | Milk, whole, 3.25% milkfat, with added vitamin D |
| Leche semidesnatada (2 %) | bebida | 171267 | Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D |
| Leche baja en grasa (1 %) | bebida | 170872 | Milk, lowfat, fluid, 1% milkfat, with added vitamin A and vitamin D |
| Leche descremada (desnatada) | bebida | 171269 | Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim) |
| Yogur natural entero | envasado | 171284 | Yogurt, plain, whole milk |
| Yogur natural desnatado | envasado | 170887 | Yogurt, plain, skim milk |
| Yogur griego natural entero | envasado | 171304 | Yogurt, Greek, plain, whole milk |
| Yogur griego natural bajo en grasa | envasado | 170903 | Yogurt, Greek, plain, lowfat |
| Yogur griego natural desnatado (0 %) | envasado | 330137 | Yogurt, Greek, plain, nonfat |
| Queso cottage | envasado | 172179 | Cheese, cottage, creamed, large or small curd |
| Queso cottage bajo en grasa (2 %) | envasado | 172182 | Cheese, cottage, lowfat, 2% milkfat |
| Ricota (queso ricotta) entera | envasado | 170851 | Cheese, ricotta, whole milk |
| Queso blanco (tipo llanero) | envasado | 172224 | Cheese, white, queso blanco |
| Queso fresco | envasado | 2647442 | Cheese, queso fresco, solid |
| Queso añejo (mexicano) | envasado | 172201 | Cheese, mexican, queso anejo |
| Queso cotija | envasado | 170898 | Cheese, mexican, queso cotija |
| Queso Chihuahua (menonita) | envasado | 173438 | Cheese, mexican, queso chihuahua |
| Queso gouda (queso amarillo) | envasado | 171241 | Cheese, gouda |
| Queso edam (queso de bola) | envasado | 173419 | Cheese, edam |
| Queso mozzarella | envasado | 170845 | Cheese, mozzarella, whole milk |
| Queso mozzarella semidesnatado | envasado | 170847 | Cheese, mozzarella, part skim milk |
| Queso cheddar | envasado | 173414 | Cheese, cheddar (Includes foods for USDA's Food Distribution Program) |
| Queso feta | envasado | 173420 | Cheese, feta |
| Queso parmesano | envasado | 170848 | Cheese, parmesan, hard |
| Queso crema (para untar) | envasado | 173418 | Cheese, cream |
| Queso de cabra fresco (blando) | envasado | 173435 | Cheese, goat, soft type |
| Queso de cabra semicurado | envasado | 173433 | Cheese, goat, semisoft type |
| Mantequilla sin sal | envasado | 173430 | Butter, without salt |
| Margarina | envasado | 172347 | Margarine, regular, 80% fat, composite, tub, with salt |
| Nata para montar (crema de leche espesa) | envasado | 170859 | Cream, fluid, heavy whipping |
| Helado de vainilla | envasado | 167575 | Ice creams, vanilla |
| Tofu normal (blando) | envasado | 172476 | Tofu, raw, regular, prepared with calcium sulfate |
| Tofu firme | envasado | 172475 | Tofu, raw, firm, prepared with calcium sulfate |
| Tofu frito | frito | 172451 | Tofu, fried |
| Tempeh, crudo | crudo | 174272 | Tempeh |
| Tempeh cocinado | cocido | 172467 | Tempeh, cooked |
| Edamame cocido | cocido | 168411 | Edamame, frozen, prepared |
| Hummus (comercial) | envasado | 174289 | Hummus, commercial |
| Hummus casero | otro | 172454 | Hummus, home prepared |
| Frijoles negros (caraotas) cocidos | cocido | 173735 | Beans, black, mature seeds, cooked, boiled, without salt |
| Frijoles negros (caraotas), crudos | crudo | 173734 | Beans, black, mature seeds, raw |
| Frijoles rojos cocidos | cocido | 175194 | Beans, kidney, red, mature seeds, cooked, boiled, without salt |
| Frijoles pintos cocidos (de la olla) | cocido | 175200 | Beans, pinto, mature seeds, cooked, boiled, without salt |
| Frijoles refritos (enlatados) | envasado | 172438 | Refried beans, canned, traditional style |
| Frijoles refritos (restaurante mexicano) | frito | 167666 | Restaurant, Mexican, refried beans |
| Alubias blancas (frijoles blancos) cocidas | cocido | 173746 | Beans, navy, mature seeds, cooked, boiled, without salt |
| Lentejas cocidas | cocido | 172421 | Lentils, mature seeds, cooked, boiled, without salt |
| Lentejas, crudas | crudo | 172420 | Lentils, raw |
| Garbanzos cocidos | cocido | 173757 | Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt |
| Garbanzos, crudos | crudo | 173756 | Chickpeas (garbanzo beans, bengal gram), mature seeds, raw |
| Garbanzos en conserva, escurridos | envasado | 173800 | Chickpeas (garbanzo beans, bengal gram), mature seeds, canned, drained solids |
| Arvejas (guisantes) cocidas | cocido | 170017 | Peas, green, frozen, cooked, boiled, drained, without salt |
| Quinchoncho (gandules) cocido | cocido | 172437 | Pigeon peas (red gram), mature seeds, cooked, boiled, without salt |
| Frijol carita cocido | cocido | 173759 | Cowpeas, common (blackeyes, crowder, southern), mature seeds, cooked, boiled, without salt |
| Arroz blanco cocido | cocido | 168878 | Rice, white, long-grain, regular, enriched, cooked |
| Arroz blanco, crudo | crudo | 168877 | Rice, white, long-grain, regular, raw, enriched |
| Arroz integral cocido | cocido | 169704 | Rice, brown, long-grain, cooked (Includes foods for USDA's Food Distribution Program) |
| Arroz integral, crudo | crudo | 169703 | Rice, brown, long-grain, raw (Includes foods for USDA's Food Distribution Program) |
| Quinoa cocida | cocido | 168917 | Quinoa, cooked |
| Quinoa, cruda | crudo | 168874 | Quinoa, uncooked |
| Avena en hojuelas, cruda | crudo | 173904 | Cereals, oats, regular and quick, not fortified, dry |
| Avena cocida en agua (porridge) | cocido | 173905 | Cereals, oats, regular and quick, unenriched, cooked with water (includes boiling and microwaving), without salt |
| Pasta cocida | cocido | 169737 | Pasta, cooked, enriched, without added salt |
| Pasta seca, cruda | crudo | 169736 | Pasta, dry, enriched |
| Fideos al huevo cocidos | cocido | 168919 | Noodles, egg, cooked, enriched, with added salt |
| Cuscús cocido | cocido | 169700 | Couscous, cooked |
| Cuscús seco, crudo | crudo | 169699 | Couscous, dry |
| Pan blanco de molde | horneado | 174924 | Bread, white, commercially prepared (includes soft bread crumbs) |
| Pan integral de molde | horneado | 172688 | Bread, whole-wheat, commercially prepared |
| Pan francés, baguette o de masa madre | horneado | 172675 | Bread, french or vienna (includes sourdough) |
| Pan blanco tostado | horneado | 174925 | Bread, white, commercially prepared, toasted |
| Pan italiano | horneado | 174913 | Bread, Italian |
| Pan de centeno | horneado | 172684 | Bread, rye |
| Pan pita (árabe) | horneado | 174915 | Bread, pita, white, enriched |
| Pan de hamburguesa o de perro caliente | horneado | 172796 | Rolls, hamburger or hotdog, plain |
| Bagel | horneado | 174899 | Bagels, plain, enriched, with calcium propionate (includes onion, poppy, sesame) |
| Panqueques (pancakes) caseros | a_la_plancha | 175009 | Pancakes, plain, prepared from recipe |
| Waffles caseros | horneado | 175039 | Waffles, plain, prepared from recipe |
| Croissant de mantequilla | horneado | 174987 | Croissants, butter |
| Dona glaseada | frito | 172758 | Doughnuts, yeast-leavened, glazed, enriched (includes honey buns) |
| Tortilla de maíz | otro | 175036 | Tortillas, ready-to-bake or -fry, corn |
| Tortilla de trigo (harina) | otro | 175037 | Tortillas, ready-to-bake or -fry, flour, refrigerated |
| Arepa (restaurante) | otro | 168070 | Restaurant, Latino, arepa (unleavened cornmeal bread) |
| Harina de maíz nixtamalizada (masa harina), cruda | crudo | 2710835 | Corn flour, masa harina, white or yellow, dry, raw |
| Galletas de soda (saladas) | envasado | 172746 | Crackers, saltines (includes oyster, soda, soup) |
| Galletas María | envasado | 171867 | Cookies, Marie biscuit |
| Pan rallado | envasado | 174928 | Bread, crumbs, dry, grated, plain |
| Copos de maíz (corn flakes) | envasado | 174648 | Cereals ready-to-eat, RALSTON Corn Flakes |
| Cereal de aros de avena | envasado | 173884 | Cereals ready-to-eat, GENERAL MILLS, CHEERIOS |
| Copos de maíz azucarados | envasado | 172990 | Cereals ready-to-eat, MALT-O-MEAL, Frosted Flakes |
| Granola casera | horneado | 171646 | Cereals ready-to-eat, granola, homemade |
| Barrita de granola (crujiente) | envasado | 167542 | Snacks, granola bars, hard, plain |
| Papa (patata) cocida, sin piel | cocido | 170440 | Potatoes, boiled, cooked without skin, flesh, without salt |
| Papa (patata), cruda | crudo | 170026 | Potatoes, flesh and skin, raw |
| Papa (patata) al horno con piel | horneado | 170093 | Potatoes, baked, flesh and skin, without salt |
| Puré de papa (patata) | otro | 168555 | Potatoes, mashed, home-prepared, whole milk and butter added |
| Papas fritas (patatas fritas) | frito | 170698 | Fast foods, potato, french fried in vegetable oil |
| Papas fritas de bolsa (chips) | frito | 169677 | Snacks, potato chips, plain, salted |
| Batata (camote, boniato) asada | horneado | 168483 | Sweet potato, cooked, baked in skin, flesh, without salt |
| Batata (camote), cruda | crudo | 168482 | Sweet potato, raw, unprepared (Includes foods for USDA's Food Distribution Program) |
| Batata (camote) hervida | cocido | 168484 | Sweet potato, cooked, boiled, without skin |
| Yuca (mandioca), cruda | crudo | 169985 | Cassava, raw |
| Ñame cocido | cocido | 170072 | Yam, cooked, boiled, drained, or baked, without salt |
| Plátano macho verde, crudo | crudo | 168215 | Plantains, green, raw |
| Plátano macho maduro, crudo | crudo | 169130 | Plantains, yellow, raw |
| Plátano macho verde, cocido | cocido | 168216 | Plantains, green, boiled |
| Plátano macho maduro, horneado | horneado | 169131 | Plantains, yellow, baked |
| Plátano macho maduro frito (tajadas) | frito | 168200 | Plantains, yellow, fried, Latino restaurant |
| Tostones (plátano verde frito) | frito | 168199 | Plantains, green, fried |
| Maíz dulce en granos, cocido | cocido | 169999 | Corn, sweet, yellow, cooked, boiled, drained, without salt |
| Maíz dulce en granos, crudo | crudo | 169998 | Corn, sweet, yellow, raw |
| Mazorca de maíz (elote) cocida | cocido | 168401 | Corn, sweet, yellow, frozen, kernels on cob, cooked, boiled, drained, without salt |
| Maíz pozolero (nixtamal) en conserva | envasado | 169701 | Hominy, canned, white |
| Totopos (chips de tortilla) | frito | 167558 | Snacks, tortilla chips, plain, white corn, salted |
| Nachos con queso | otro | 170291 | Fast foods, nachos, with cheese |
| Palomitas de maíz (sin aceite) | otro | 167959 | Snacks, popcorn, air-popped |
| Brócoli, crudo | crudo | 170379 | Broccoli, raw |
| Brócoli cocido | cocido | 169967 | Broccoli, cooked, boiled, drained, without salt |
| Espinaca, cruda | crudo | 168462 | Spinach, raw |
| Espinaca cocida | cocido | 168463 | Spinach, cooked, boiled, drained, without salt |
| Champiñones, crudos | crudo | 169251 | Mushrooms, white, raw |
| Champiñones cocidos | cocido | 169252 | Mushrooms, white, cooked, boiled, drained, without salt |
| Espárragos, crudos | crudo | 168389 | Asparagus, raw |
| Espárragos cocidos | cocido | 168390 | Asparagus, cooked, boiled, drained |
| Pepino | crudo | 168409 | Cucumber, with peel, raw |
| Lechuga romana | crudo | 169247 | Lettuce, cos or romaine, raw |
| Lechuga iceberg (americana) | crudo | 2346388 | Lettuce, iceberg, raw |
| Calabacín (zucchini), crudo | crudo | 169291 | Squash, summer, zucchini, includes skin, raw |
| Calabacín (zucchini) cocido | cocido | 169292 | Squash, summer, zucchini, includes skin, cooked, boiled, drained, without salt |
| Pimiento rojo, crudo | crudo | 170108 | Peppers, sweet, red, raw |
| Pimiento verde, crudo | crudo | 170427 | Peppers, sweet, green, raw |
| Tomate | crudo | 170457 | Tomatoes, red, ripe, raw, year round average |
| Kale (col rizada), cruda | crudo | 168421 | Kale, raw |
| Zanahoria, cruda | crudo | 170393 | Carrots, raw |
| Zanahoria cocida | cocido | 170394 | Carrots, cooked, boiled, drained, without salt |
| Apio en rama (celery) | crudo | 169988 | Celery, raw |
| Cebolla | crudo | 170000 | Onions, raw |
| Ajo | crudo | 169230 | Garlic, raw |
| Repollo (col) | crudo | 169975 | Cabbage, raw |
| Coliflor | crudo | 169986 | Cauliflower, raw |
| Berenjena | crudo | 169228 | Eggplant, raw |
| Auyama (calabaza, zapallo) cocida | cocido | 168449 | Pumpkin, cooked, boiled, drained, without salt |
| Calabaza butternut, cruda | crudo | 169295 | Squash, winter, butternut, raw |
| Remolacha (betabel) cocida | cocido | 169146 | Beets, cooked, boiled, drained |
| Remolacha (betabel), cruda | crudo | 169145 | Beets, raw |
| Vainitas (judías verdes) cocidas | cocido | 169141 | Beans, snap, green, cooked, boiled, drained, without salt |
| Vainitas (judías verdes), crudas | crudo | 169961 | Beans, snap, green, raw |
| Aguacate | crudo | 171705 | Avocados, raw, all commercial varieties |
| Aceitunas verdes | envasado | 169096 | Olives, pickled, canned or bottled, green |
| Aceitunas negras | envasado | 169094 | Olives, ripe, canned (small-extra large) |
| Nopal, crudo | crudo | 168571 | Nopales, raw |
| Nopal cocido | cocido | 169388 | Nopales, cooked, without salt |
| Chile jalapeño | crudo | 168576 | Peppers, jalapeno, raw |
| Chile serrano | crudo | 169395 | Peppers, serrano, raw |
| Chile rojo picante (guindilla) | crudo | 170106 | Peppers, hot chili, red, raw |
| Banana (cambur, plátano) | crudo | 173944 | Bananas, raw |
| Manzana con piel | crudo | 171688 | Apples, raw, with skin (Includes foods for USDA's Food Distribution Program) |
| Naranja | crudo | 169097 | Oranges, raw, all commercial varieties |
| Mandarina | crudo | 169105 | Tangerines, (mandarin oranges), raw |
| Pera | crudo | 169118 | Pears, raw |
| Mango | crudo | 169910 | Mangos, raw |
| Lechosa (papaya) | crudo | 169926 | Papayas, raw |
| Piña | crudo | 169124 | Pineapple, raw, all varieties |
| Fresas | crudo | 167762 | Strawberries, raw |
| Uvas | crudo | 174683 | Grapes, red or green (European type, such as Thompson seedless), raw |
| Patilla (sandía) | crudo | 167765 | Watermelon, raw |
| Melón | crudo | 169092 | Melons, cantaloupe, raw |
| Guayaba | crudo | 173044 | Guavas, common, raw |
| Parchita (maracuyá) | crudo | 169108 | Passion-fruit, (granadilla), purple, raw |
| Kiwi | crudo | 168153 | Kiwifruit, green, raw |
| Durazno (melocotón) | crudo | 169928 | Peaches, yellow, raw |
| Coco fresco (pulpa) | crudo | 170169 | Nuts, coconut meat, raw |
| Arándanos | crudo | 171711 | Blueberries, raw |
| Frambuesas | crudo | 167755 | Raspberries, raw |
| Cerezas | crudo | 171719 | Cherries, sweet, raw |
| Ciruela | crudo | 169949 | Plums, raw |
| Higos frescos | crudo | 173021 | Figs, raw |
| Limón amarillo (sin cáscara) | crudo | 167746 | Lemons, raw, without peel |
| Lima (limón verde) | crudo | 168155 | Limes, raw |
| Dátiles medjool | crudo | 168191 | Dates, medjool |
| Granada | crudo | 169134 | Pomegranates, raw |
| Mamey (zapote mamey) | crudo | 167760 | Sapote, mamey, raw |
| Mamey de Santo Domingo (mamey caribeño) | crudo | 169909 | Mammy-apple, (mamey), raw |
| Tamarindo (pulpa) | crudo | 167763 | Tamarinds, raw |
| Guanábana | crudo | 167761 | Soursop, raw |
| Chirimoya | crudo | 173953 | Cherimoya, raw |
| Acerola (semeruco) | crudo | 171686 | Acerola, (west indian cherry), raw |
| Almendras | crudo | 170567 | Nuts, almonds |
| Nueces | crudo | 170187 | Nuts, walnuts, english |
| Merey (anacardos), crudo | crudo | 170162 | Nuts, cashew nuts, raw |
| Pistachos, crudos | crudo | 170184 | Nuts, pistachio nuts, raw |
| Avellanas | crudo | 170581 | Nuts, hazelnuts or filberts |
| Frutos secos mixtos tostados (con maní) | otro | 170585 | Nuts, mixed nuts, dry roasted, with peanuts, without salt added |
| Maní (cacahuete) tostado | otro | 173806 | Peanuts, all types, dry-roasted, without salt |
| Maní (cacahuete), crudo | crudo | 172430 | Peanuts, all types, raw |
| Mantequilla de maní (crema de cacahuete) | envasado | 172470 | Peanut butter, smooth style, without salt |
| Semillas de chía | crudo | 170554 | Seeds, chia seeds, dried |
| Linaza (semillas de lino) | crudo | 169414 | Seeds, flaxseed |
| Semillas de girasol peladas | crudo | 170562 | Seeds, sunflower seed kernels, dried |
| Semillas de calabaza (pepitas) | crudo | 170556 | Seeds, pumpkin and squash seed kernels, dried |
| Ajonjolí (sésamo) | crudo | 170150 | Seeds, sesame seeds, whole, dried |
| Aceite de oliva | envasado | 171413 | Oil, olive, salad or cooking |
| Aceite de girasol (aceite vegetal) | envasado | 171025 | Oil, sunflower, linoleic, (approx. 65%) |
| Aceite de canola (colza) | envasado | 172336 | Oil, canola |
| Mayonesa | envasado | 171009 | Salad dressing, mayonnaise, regular |
| Azúcar blanca | envasado | 169655 | Sugars, granulated |
| Azúcar morena | envasado | 168833 | Sugars, brown |
| Miel | envasado | 169640 | Honey |
| Mermelada | envasado | 169641 | Jams and preserves |
| Kétchup (salsa de tomate dulce) | envasado | 168556 | Catsup |
| Salsa de tomate natural (enlatada) | envasado | 170054 | Tomato products, canned, sauce |
| Salsa mexicana (lista para servir) | envasado | 174524 | Sauce, salsa, ready-to-serve |
| Chocolate negro 70-85 % | envasado | 170273 | Chocolate, dark, 70-85% cacao solids |
| Chocolate negro 60-69 % | envasado | 170272 | Chocolate, dark, 60-69% cacao solids |
| Flan casero (quesillo) | horneado | 167574 | Desserts, flan, caramel custard, prepared-from-recipe |
| Arroz con leche (restaurante latino) | cocido | 168063 | Restaurant, Latino, arroz con leche (rice pudding) |
| Café negro (filtrado) | bebida | 171890 | Beverages, coffee, brewed, prepared with tap water |
| Café espresso | bebida | 171891 | Beverages, coffee, brewed, espresso, restaurant-prepared |
| Té negro sin azúcar | bebida | 173227 | Beverages, tea, black, brewed, prepared with tap water |
| Jugo (zumo) de naranja natural | bebida | 169098 | Orange juice, raw (Includes foods for USDA's Food Distribution Program) |
| Jugo (zumo) de naranja envasado | bebida | 169100 | Orange juice, chilled, includes from concentrate |
| Jugo (zumo) de manzana | bebida | 173933 | Apple juice, canned or bottled, unsweetened, without added ascorbic acid |
| Jugo (zumo) de piña | bebida | 169947 | Pineapple juice, canned or bottled, unsweetened, without added ascorbic acid |
| Jugo (zumo) de uva | bebida | 173042 | Grape juice, canned or bottled, unsweetened, without added ascorbic acid |
| Jugo de parchita (maracuyá) natural, sin azúcar | bebida | 169110 | Passion-fruit juice, yellow, raw |
| Refresco de cola | bebida | 174852 | Beverages, carbonated, cola, regular |
| Refresco de cola sin azúcar (light/zero) | bebida | 175099 | Beverages, carbonated, low calorie, cola or pepper-type, with aspartame, contains caffeine |
| Refresco de lima-limón | bebida | 173205 | Beverages, carbonated, lemon-lime soda, no caffeine |
| Refresco de naranja | bebida | 174854 | Beverages, carbonated, orange |
| Bebida energética | bebida | 173210 | Beverages, Energy drink, RED BULL |
| Cerveza | bebida | 168746 | Alcoholic beverage, beer, regular, all |
| Cerveza light | bebida | 168749 | Alcoholic beverage, beer, light |
| Vino tinto | bebida | 173190 | Alcoholic beverage, wine, table, red |
| Vino blanco | bebida | 174837 | Alcoholic beverage, wine, table, white |
| Licor destilado (ron, vodka, whisky, ginebra) | bebida | 171919 | Alcoholic beverage, distilled, all (gin, rum, vodka, whiskey) 86 proof |
| Bebida de almendra sin azúcar | bebida | 174832 | Beverages, almond milk, unsweetened, shelf stable |
| Bebida de avena sin azúcar | bebida | 2257046 | Oat milk, unsweetened, plain, refrigerated |
| Bebida de soja (soya) | bebida | 172456 | Soymilk, original and vanilla, with added calcium, vitamins A and D |
| Bebida de arroz sin azúcar | bebida | 171942 | Beverages, rice milk, unsweetened |
| Agua de coco | bebida | 174831 | Beverages, Coconut water, ready-to-drink, unsweetened |
| Proteína de suero (whey) en polvo | envasado | 173180 | Beverages, Protein powder whey based |
| Hamburguesa sencilla con pan (comida rápida) | otro | 170694 | Fast foods, hamburger; single, regular patty; with condiments |
| Hamburguesa doble con salsa especial (comida rápida) | otro | 170720 | McDONALD'S, BIG MAC |
| Pizza de queso, masa gruesa (pizzería) | horneado | 173293 | Fast Food, Pizza Chain, 14" pizza, cheese topping, thick crust |
| Pizza de queso, masa fina (pizzería) | horneado | 173294 | Fast Food, Pizza Chain, 14" pizza, cheese topping, thin crust |
| Macarrones con queso (de caja, preparados) | cocido | 169770 | Macaroni and cheese, box mix with cheese sauce, prepared |
| Taco suave de carne con queso y lechuga | otro | 170763 | Fast foods, taco with beef, cheese and lettuce, soft |
| Taco suave de pollo con queso y lechuga | otro | 170764 | Fast foods, taco with chicken, lettuce and cheese, soft |
| Quesadilla de queso (restaurante mexicano) | otro | 169035 | Restaurant, Mexican, cheese quesadilla |
| Quesadilla de pollo | otro | 170765 | Fast foods, quesadilla, with chicken |
| Tamal de maíz (restaurante latino) | cocido | 167664 | Restaurant, Latino, tamale, corn |
| Tamal de cerdo (restaurante latino) | cocido | 168067 | Restaurant, Latino, tamale, pork |
| Enchilada de queso (restaurante mexicano) | otro | 169855 | Restaurant, Mexican, cheese enchilada |
| Burrito de frijoles (comida rápida) | otro | 172038 | Fast foods, burrito, with beans |
| Empanada de carne frita (restaurante latino) | frito | 167660 | Restaurant, Latino, empanadas, beef, prepared |
| Arroz con pollo (restaurante latino) | cocido | 167659 | Restaurant, Latino, chicken and rice, entree, prepared |
| Arroz con frijoles negros (moros) | cocido | 168064 | Restaurant, Latino, Arroz con frijoles negros (rice and black beans) |
| Arroz rojo a la mexicana (restaurante) | cocido | 167665 | Restaurant, Mexican, spanish rice |
| Sopa de frijoles negros (restaurante latino) | cocido | 168068 | Restaurant, Latino, black bean soup |
| Pupusa de queso | otro | 167662 | Restaurant, Latino, pupusas con queso (pupusas, cheese) |
| Pupusa de chicharrón (cerdo) | otro | 167663 | Restaurant, Latino, pupusas del cerdo (pupusas, pork) |
