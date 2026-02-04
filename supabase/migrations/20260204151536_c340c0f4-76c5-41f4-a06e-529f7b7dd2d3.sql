-- Paso 1: Agregar constraint UNIQUE a cuadros_importacion.codigo
-- Esto permite que sea referenciado por una foreign key
ALTER TABLE cuadros_importacion 
ADD CONSTRAINT cuadros_importacion_codigo_unique UNIQUE (codigo);

-- Paso 2: Eliminar la foreign key existente que apunta a id
ALTER TABLE productos 
DROP CONSTRAINT IF EXISTS productos_cuadro_fkey;

-- Paso 3: Crear nueva foreign key apuntando a codigo
ALTER TABLE productos 
ADD CONSTRAINT productos_cuadro_fkey 
FOREIGN KEY (cuadro) REFERENCES cuadros_importacion(codigo);