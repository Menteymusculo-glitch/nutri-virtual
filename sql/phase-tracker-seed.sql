-- ============================================================
-- Fase 1 — Seed de alimentos (idempotente)
-- Ejecutar DESPUÉS de sql/phase-tracker.sql.
-- Generado por un script; 168 alimentos, 36 marcados como APROX/REVISAR.
--
-- Valores por 100 g de porción comestible. Fuentes: FOOD_DB de
-- src/lib/macroCalculator.ts, USDA FoodData Central (SR Legacy) y BEDCA.
-- Los marcados "APROX" son estimaciones (platos caseros, productos
-- locales sin ficha oficial): Ray, por favor revísalos.
-- Re-ejecutar actualiza los valores de los alimentos 'seed'.
-- ============================================================

INSERT INTO public.foods (name, name_norm, kcal_100g, protein_100g, carbs_100g, fat_100g) VALUES
  -- Del FOOD_DB de src/lib/macroCalculator.ts (por 100 g)
  ('Huevo entero', 'huevo entero', 143, 12.6, 0.7, 9.5),
  ('Clara de huevo', 'clara de huevo', 52, 10.9, 0.7, 0.2),
  ('Pechuga de pollo', 'pechuga de pollo', 175, 26.4, 0.1, 7.7),
  ('Pollo', 'pollo', 167, 20, 0, 9.7),
  ('Pavo', 'pavo', 107, 21.9, 0, 2.2),
  ('Salmón', 'salmon', 160, 25.8, 0, 5.5),
  ('Atún fresco', 'atun fresco', 109, 24.4, 0, 0.5),
  ('Atún enlatado en aceite', 'atun enlatado en aceite', 198, 29.1, 0, 8.2),
  ('Tilapia', 'tilapia', 81, 15.8, 0, 1.9),
  ('Camarón', 'camaron', 91, 17.4, 1.2, 1.3),
  ('Sardinas', 'sardinas', 208, 24.6, 0, 11.5),
  ('Carne de res magra', 'carne de res magra', 123, 20, 0, 5),
  ('Tofu', 'tofu', 76, 8, 1.9, 4.5),
  ('Tempeh', 'tempeh', 193, 19, 9, 11),
  ('Queso de cabra', 'queso de cabra', 250, 17, 2, 18),
  ('Yogur griego', 'yogur griego', 97, 9, 4, 5),
  ('Aguacate', 'aguacate', 160, 2, 8.5, 14.7),
  ('Brócoli', 'brocoli', 34, 2.8, 6.6, 0.4),
  ('Espinaca', 'espinaca', 23, 2.9, 3.6, 0.4),
  ('Champiñón', 'champinon', 22, 3.1, 3.3, 0.3),
  ('Espárragos', 'esparragos', 20, 2.2, 3.9, 0.1),
  ('Pepino', 'pepino', 12, 0.6, 2.2, 0.2),
  ('Lechuga', 'lechuga', 14, 0.9, 3, 0.1),
  ('Calabacín', 'calabacin', 14, 0.6, 2.2, 0.2),
  ('Pimiento', 'pimiento', 24, 0.9, 5.1, 0.2),
  ('Tomate', 'tomate', 18, 0.9, 3.9, 0.2),
  ('Kale', 'kale', 28, 1.9, 5.6, 0.4),
  ('Zanahoria', 'zanahoria', 41, 0.9, 9.6, 0.2),
  ('Apio', 'apio', 16, 0.7, 3, 0.2),
  ('Batata (camote)', 'batata camote', 101, 1.2, 23, 0.3),
  ('Arroz integral cocido', 'arroz integral cocido', 120, 2.9, 24.9, 0.9),
  ('Quinoa cocida', 'quinoa cocida', 120, 4.4, 21.3, 1.9),
  ('Avena en hojuelas (cruda)', 'avena en hojuelas cruda', 379, 13.2, 67.7, 6.5),
  ('Lentejas cocidas', 'lentejas cocidas', 115, 9, 20, 0.4),
  ('Garbanzos cocidos', 'garbanzos cocidos', 163, 8.8, 27.3, 2.6),
  ('Almendras', 'almendras', 607, 20.3, 20.4, 54),
  ('Nueces', 'nueces', 654, 15.2, 13.7, 65.2),
  ('Semillas de chía', 'semillas de chia', 486, 16.5, 42.1, 30.7),  -- REVISAR: FOOD_DB tiene 534/18.3/28.9/42.2 (copia de linaza); aquí va el valor USDA de chía
  ('Linaza', 'linaza', 534, 18.3, 28.9, 42.2),
  ('Aceite de oliva', 'aceite de oliva', 884, 0, 0, 100),
  ('Cambur (banana)', 'cambur banana', 89, 1.1, 22.8, 0.3),  -- En FOOD_DB se llama "platano" pero son valores de banana/cambur
  ('Arándanos', 'arandanos', 57, 0.7, 14.5, 0.3),
  ('Proteína en polvo (whey)', 'proteina en polvo whey', 380, 78, 6, 5),
  ('Bebida de almendra sin azúcar', 'bebida de almendra sin azucar', 13, 0.4, 0.4, 1.1),
  ('Bebida de avena', 'bebida de avena', 45, 0.8, 7.5, 1),
  ('Bebida de coco', 'bebida de coco', 17, 0.2, 0.8, 1.3),
  -- Cereales, panes y tubérculos
  ('Arroz blanco cocido', 'arroz blanco cocido', 130, 2.7, 28.2, 0.3),
  ('Pasta cocida', 'pasta cocida', 158, 5.8, 30.9, 0.9),
  ('Pan blanco de molde', 'pan blanco de molde', 265, 9, 49, 3.2),
  ('Pan integral', 'pan integral', 252, 12.4, 42.7, 3.5),
  ('Pan canilla (baguette)', 'pan canilla baguette', 274, 10.8, 51.9, 2.4),  -- Valores de pan francés USDA
  ('Pan tostado', 'pan tostado', 293, 9, 54, 4),  -- APROX
  ('Arepa de maíz asada (sin relleno)', 'arepa de maiz asada sin relleno', 210, 4.4, 44, 1.2),  -- APROX: masa de harina precocida + agua
  ('Harina de maíz precocida', 'harina de maiz precocida', 350, 7, 76, 1.5),  -- APROX: etiqueta típica
  ('Arepa rellena de queso blanco', 'arepa rellena de queso blanco', 250, 9, 35, 8),  -- APROX
  ('Cachapa', 'cachapa', 220, 5, 38, 6),  -- APROX: sin queso
  ('Empanada de maíz frita (carne)', 'empanada de maiz frita carne', 280, 8, 30, 14),  -- APROX
  ('Tequeño', 'tequeno', 330, 11, 30, 18),  -- APROX
  ('Tortilla de maíz', 'tortilla de maiz', 218, 5.7, 44.6, 2.9),
  ('Tortilla de trigo', 'tortilla de trigo', 304, 8.2, 50, 8),
  ('Cuscús cocido', 'cuscus cocido', 112, 3.8, 23.2, 0.2),
  ('Avena cocida en agua', 'avena cocida en agua', 71, 2.5, 12, 1.5),
  ('Copos de maíz (corn flakes)', 'copos de maiz corn flakes', 357, 7.5, 84, 0.4),
  ('Granola', 'granola', 471, 10, 64, 20),  -- APROX: varía mucho por marca
  ('Galletas de soda', 'galletas de soda', 421, 9.5, 74, 8.6),
  ('Galletas María', 'galletas maria', 436, 7, 75, 12),  -- APROX
  ('Papa cocida', 'papa cocida', 87, 1.9, 20.1, 0.1),
  ('Puré de papa', 'pure de papa', 113, 1.9, 16.8, 4.2),  -- Con leche y mantequilla
  ('Papas fritas', 'papas fritas', 312, 3.4, 41, 15),
  ('Yuca cocida', 'yuca cocida', 130, 1.2, 31, 0.3),  -- APROX
  ('Yuca frita', 'yuca frita', 290, 1.5, 40, 14),  -- APROX
  ('Ñame cocido', 'name cocido', 116, 1.5, 27.5, 0.1),
  ('Plátano cocido', 'platano cocido', 116, 0.8, 31.2, 0.2),  -- Plátano macho
  ('Plátano maduro frito (tajadas)', 'platano maduro frito tajadas', 236, 1.5, 40, 9),  -- APROX
  ('Tostones (plátano verde frito)', 'tostones platano verde frito', 309, 1.5, 49, 11.8),  -- APROX
  ('Maíz dulce cocido', 'maiz dulce cocido', 96, 3.4, 21, 1.5),
  ('Croissant', 'croissant', 406, 8.2, 45.8, 21),
  ('Cachito de jamón', 'cachito de jamon', 330, 10, 38, 15),  -- APROX
  -- Legumbres
  ('Caraotas negras cocidas', 'caraotas negras cocidas', 132, 8.9, 23.7, 0.5),
  ('Caraotas negras guisadas', 'caraotas negras guisadas', 150, 7.5, 20, 4),  -- APROX: con sofrito y aceite
  ('Frijoles rojos cocidos', 'frijoles rojos cocidos', 127, 8.7, 22.8, 0.5),
  ('Arvejas (guisantes) cocidas', 'arvejas guisantes cocidas', 84, 5.4, 15.6, 0.2),
  -- Carnes, pescados y huevos
  ('Pollo asado con piel', 'pollo asado con piel', 239, 27.3, 0, 13.6),
  ('Muslo de pollo sin piel cocido', 'muslo de pollo sin piel cocido', 179, 24.8, 0, 8.2),
  ('Pollo desmechado', 'pollo desmechado', 151, 29, 0, 3),  -- Pechuga guisada sin piel
  ('Carne mechada', 'carne mechada', 200, 26, 3, 10),  -- APROX
  ('Carne molida de res cocida', 'carne molida de res cocida', 250, 26, 0, 15),  -- 85% magra
  ('Bistec de res a la plancha', 'bistec de res a la plancha', 205, 29, 0, 9),  -- APROX
  ('Lomo de cerdo asado', 'lomo de cerdo asado', 206, 27, 0, 10),  -- APROX
  ('Chuleta de cerdo', 'chuleta de cerdo', 231, 25.5, 0, 13.6),  -- APROX
  ('Jamón cocido', 'jamon cocido', 163, 16.6, 3.8, 8.6),
  ('Jamón serrano', 'jamon serrano', 241, 30.5, 0.5, 13),  -- APROX
  ('Salchicha', 'salchicha', 290, 10, 4, 26),
  ('Chorizo', 'chorizo', 455, 24, 2, 38),
  ('Merluza', 'merluza', 72, 16, 0, 0.9),  -- APROX
  ('Atún en agua', 'atun en agua', 116, 25.5, 0, 0.8),
  ('Huevo frito', 'huevo frito', 196, 13.6, 0.8, 14.8),
  ('Huevo revuelto', 'huevo revuelto', 148, 10, 1.6, 11),
  ('Huevo duro', 'huevo duro', 155, 12.6, 1.1, 10.6),
  -- Lácteos y bebidas
  ('Queso blanco llanero (duro)', 'queso blanco llanero duro', 330, 22, 2, 26),  -- APROX
  ('Queso de mano', 'queso de mano', 260, 18, 3, 20),  -- APROX
  ('Queso fresco', 'queso fresco', 299, 18.1, 3, 23.8),
  ('Queso amarillo (gouda)', 'queso amarillo gouda', 356, 25, 2.2, 27.4),
  ('Queso mozzarella', 'queso mozzarella', 300, 22.2, 2.2, 22.4),
  ('Queso cheddar', 'queso cheddar', 403, 24.9, 1.3, 33.1),
  ('Ricota', 'ricota', 174, 11.3, 3, 13),
  ('Queso cottage', 'queso cottage', 98, 11.1, 3.4, 4.3),
  ('Leche entera', 'leche entera', 61, 3.2, 4.8, 3.3),
  ('Leche semidesnatada', 'leche semidesnatada', 46, 3.3, 4.8, 1.6),  -- APROX
  ('Leche descremada', 'leche descremada', 34, 3.4, 5, 0.1),
  ('Yogur natural entero', 'yogur natural entero', 61, 3.5, 4.7, 3.3),
  ('Yogur natural desnatado', 'yogur natural desnatado', 56, 5.7, 7.7, 0.2),
  ('Mantequilla', 'mantequilla', 717, 0.9, 0.1, 81),
  ('Margarina', 'margarina', 717, 0.2, 0.7, 80.7),
  ('Crema de leche (nata)', 'crema de leche nata', 340, 2.8, 2.7, 36),
  ('Café con leche sin azúcar', 'cafe con leche sin azucar', 35, 1.8, 2.6, 1.8),  -- APROX: mitad café, mitad leche entera
  ('Café negro', 'cafe negro', 1, 0.1, 0, 0),
  ('Té sin azúcar', 'te sin azucar', 1, 0, 0.2, 0),
  ('Jugo de naranja natural', 'jugo de naranja natural', 45, 0.7, 10.4, 0.2),
  ('Refresco azucarado (cola)', 'refresco azucarado cola', 42, 0, 10.6, 0),
  ('Cerveza', 'cerveza', 43, 0.5, 3.6, 0),
  ('Vino tinto', 'vino tinto', 85, 0.1, 2.6, 0),
  -- Frutas
  ('Manzana', 'manzana', 52, 0.3, 13.8, 0.2),
  ('Naranja', 'naranja', 47, 0.9, 11.8, 0.1),
  ('Mandarina', 'mandarina', 53, 0.8, 13.3, 0.3),
  ('Pera', 'pera', 57, 0.4, 15.2, 0.1),
  ('Mango', 'mango', 60, 0.8, 15, 0.4),
  ('Lechosa (papaya)', 'lechosa papaya', 43, 0.5, 10.8, 0.3),
  ('Piña', 'pina', 50, 0.5, 13.1, 0.1),
  ('Fresas', 'fresas', 32, 0.7, 7.7, 0.3),
  ('Uvas', 'uvas', 69, 0.7, 18.1, 0.2),
  ('Patilla (sandía)', 'patilla sandia', 30, 0.6, 7.6, 0.2),
  ('Melón', 'melon', 34, 0.8, 8.2, 0.2),
  ('Guayaba', 'guayaba', 68, 2.6, 14.3, 1),
  ('Parchita (maracuyá)', 'parchita maracuya', 97, 2.2, 23.4, 0.7),
  ('Kiwi', 'kiwi', 61, 1.1, 14.7, 0.5),
  ('Durazno (melocotón)', 'durazno melocoton', 39, 0.9, 9.5, 0.3),
  ('Coco fresco', 'coco fresco', 354, 3.3, 15.2, 33.5),
  -- Verduras
  ('Cebolla', 'cebolla', 40, 1.1, 9.3, 0.1),
  ('Ajo', 'ajo', 149, 6.4, 33, 0.5),
  ('Repollo', 'repollo', 25, 1.3, 5.8, 0.1),
  ('Coliflor', 'coliflor', 25, 1.9, 5, 0.3),
  ('Berenjena', 'berenjena', 25, 1, 5.9, 0.2),
  ('Auyama cocida (calabaza)', 'auyama cocida calabaza', 20, 0.7, 4.9, 0.1),
  ('Remolacha cocida', 'remolacha cocida', 44, 1.7, 10, 0.2),
  ('Vainitas (judías verdes) cocidas', 'vainitas judias verdes cocidas', 35, 1.9, 7.9, 0.3),
  ('Ensalada mixta (lechuga, tomate, cebolla)', 'ensalada mixta lechuga tomate cebolla', 18, 1, 3.6, 0.2),  -- APROX: sin aliño
  ('Aceitunas verdes', 'aceitunas verdes', 145, 1, 3.8, 15.3),
  -- Platos preparados
  ('Pabellón criollo', 'pabellon criollo', 160, 9, 18, 6),  -- APROX: arroz, caraotas, carne mechada y tajadas
  ('Hallaca', 'hallaca', 190, 7, 18, 10),  -- APROX
  ('Arroz con pollo', 'arroz con pollo', 160, 9, 20, 5),  -- APROX
  ('Sancocho de gallina', 'sancocho de gallina', 70, 5, 7, 2.5),  -- APROX
  ('Guasacaca', 'guasacaca', 120, 1.5, 6, 10),  -- APROX
  ('Pizza de queso', 'pizza de queso', 266, 11.4, 33, 9.7),
  ('Hamburguesa con pan', 'hamburguesa con pan', 254, 12.9, 29.8, 9.4),  -- APROX: comida rápida sencilla
  ('Arroz con leche', 'arroz con leche', 130, 3.5, 22, 3),  -- APROX
  ('Quesillo (flan)', 'quesillo flan', 220, 6, 30, 8),  -- APROX
  -- Grasas, dulces y otros
  ('Aceite vegetal (girasol, maíz)', 'aceite vegetal girasol maiz', 884, 0, 0, 100),
  ('Mayonesa', 'mayonesa', 680, 1, 0.6, 75),
  ('Mantequilla de maní', 'mantequilla de mani', 588, 25, 20, 50),
  ('Maní tostado', 'mani tostado', 585, 23.7, 21.5, 49.7),
  ('Azúcar', 'azucar', 387, 0, 100, 0),
  ('Papelón (panela)', 'papelon panela', 380, 0.4, 95, 0.1),  -- APROX
  ('Miel', 'miel', 304, 0.3, 82.4, 0),
  ('Mermelada', 'mermelada', 278, 0.4, 68.9, 0.1),
  ('Salsa de tomate (kétchup)', 'salsa de tomate ketchup', 101, 1, 27, 0.1),
  ('Chocolate negro 70%', 'chocolate negro 70', 598, 7.8, 45.9, 42.6),
  ('Helado de vainilla', 'helado de vainilla', 207, 3.5, 23.6, 11)
ON CONFLICT (name_norm, source) DO UPDATE SET
  name         = EXCLUDED.name,
  kcal_100g    = EXCLUDED.kcal_100g,
  protein_100g = EXCLUDED.protein_100g,
  carbs_100g   = EXCLUDED.carbs_100g,
  fat_100g     = EXCLUDED.fat_100g;

-- Verificar:
-- SELECT count(*) FROM public.foods WHERE source = 'seed';   -- 168
