-- Remove the redundant "Recaudador" field from Maraton: it duplicated
-- razonSocial/nit in practice and was never populated by the bulk import.
ALTER TABLE "Maraton" DROP CONSTRAINT "Maraton_idProfesionalRecaudador_fkey";

ALTER TABLE "Maraton" DROP COLUMN "idProfesionalRecaudador";
