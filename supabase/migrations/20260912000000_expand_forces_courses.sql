-- Migration: 20260912000000_expand_forces_courses.sql
-- Description: Expanded course catalogue for Army, PAF, and Navy

INSERT INTO public.forces (id, name, code)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Pakistan Army', 'PAKISTAN_ARMY'),
  ('00000000-0000-0000-0000-000000000002', 'Pakistan Air Force', 'PAKISTAN_AIR_FORCE'),
  ('00000000-0000-0000-0000-000000000003', 'Pakistan Navy', 'PAKISTAN_NAVY')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;


INSERT INTO public.courses (id, force_id, code, name)
VALUES ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PMA_LC', 'PMA Long Course')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'TCC', 'Technical Cadet Course (TCC)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'LCC', 'Lady Cadet Course (LCC)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'AFNS', 'Armed Forces Nursing Services (AFNS)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'MEDICAL_CADET', 'Medical Cadet')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'ARMY_SOLDIER_TECH', 'Soldier / Clerk / Technical')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'PAF_GDP', 'General Duty Pilot — GD(P)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'PAF_AIR_DEFENCE', 'Air Defence')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'PAF_CAE', 'College of Aeronautical Engineering (CAE)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'PAF_SSC', 'Short Service Commission (SSC)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'PAF_SPSSC', 'Special Purpose SSC (SPSSC)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'PAF_AIRMEN', 'Airmen / Airwomen Induction')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'NAVY_PN_CADET', 'PN Cadet')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'NAVY_SSC', 'Short Service Commission (SSC)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'NAVY_M_CADET', 'M-Cadet / Medical Cadet')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'NAVY_SAILOR_TECH', 'Sailor Technical')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'NAVY_MARINES', 'Pakistan Marines')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

INSERT INTO public.courses (id, force_id, code, name)
VALUES ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'NAVY_FMT', 'Female Medical Technician (FMT)')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, force_id = EXCLUDED.force_id;

