-- Migration: 20261010000050_seed_additional_non_verbal_questions.sql
-- Description: Seed 10 additional non-verbal intelligence questions (nv-Q11 through nv-Q20) with 4 options each and course associations

DO $$
DECLARE
  v_subject_id UUID := 'caee6341-8fbd-4482-9233-d577d674bc2d';
  v_author_id UUID := 'af3c38ed-24ba-44e2-a1d7-12a408acecec';
BEGIN
  -- nv-Q11
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, stem_image_url, explanation, time_limit_seconds, status, author_id, tags, cognitive_level, question_format, is_verified, bank_key, times_attempted, times_correct)
  VALUES ('45000000-0000-0000-0000-00000000000b', 'nv-Q11', v_subject_id, 'MEDIUM', 'Which figure replaces the question mark to complete the 3x3 pattern matrix?', NULL, 'Across each row, the outer shape remains constant while the internal line alternates from vertical to horizontal and the dot count increases by one.', 30, 'APPROVED', v_author_id, ARRAY['Intelligence', 'Non-Verbal', 'Non-Verbal Intelligence', 'Shared Intelligence', 'TestDummy'], 'APPLYING', 'MCQ_SINGLE', true, 'nv', 0, 0)
  ON CONFLICT (id) DO UPDATE SET stem = EXCLUDED.stem, explanation = EXCLUDED.explanation;

  INSERT INTO public.question_options (id, question_id, option_key, label, text, image_url, is_correct, sort_order)
  VALUES
    ('46000000-0000-000b-0000-000000000001', '45000000-0000-0000-0000-00000000000b', 'A', 'A', 'Figure A (Circle with vertical bisector and two solid dots)', NULL, false, 0),
    ('46000000-0000-000b-0000-000000000002', '45000000-0000-0000-0000-00000000000b', 'B', 'B', 'Figure B (Circle with horizontal bisector and three open dots)', NULL, true, 1),
    ('46000000-0000-000b-0000-000000000003', '45000000-0000-0000-0000-00000000000b', 'C', 'C', 'Figure C (Square with concentric cross)', NULL, false, 2),
    ('46000000-0000-000b-0000-000000000004', '45000000-0000-0000-0000-00000000000b', 'D', 'D', 'Figure D (Triangle with diagonal line)', NULL, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- nv-Q12
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, stem_image_url, explanation, time_limit_seconds, status, author_id, tags, cognitive_level, question_format, is_verified, bank_key, times_attempted, times_correct)
  VALUES ('45000000-0000-0000-0000-00000000000c', 'nv-Q12', v_subject_id, 'MEDIUM', 'Identify the next shape in the sequence: Triangle (3 sides, 1 dot), Square (4 sides, 2 dots), Pentagon (5 sides, 3 dots), ...', NULL, 'Both the number of sides (3 -> 4 -> 5 -> 6) and the number of enclosed dots (1 -> 2 -> 3 -> 4) increase by 1 at each step.', 30, 'APPROVED', v_author_id, ARRAY['Intelligence', 'Non-Verbal', 'Non-Verbal Intelligence', 'Shared Intelligence', 'TestDummy'], 'APPLYING', 'MCQ_SINGLE', true, 'nv', 0, 0)
  ON CONFLICT (id) DO UPDATE SET stem = EXCLUDED.stem, explanation = EXCLUDED.explanation;

  INSERT INTO public.question_options (id, question_id, option_key, label, text, image_url, is_correct, sort_order)
  VALUES
    ('46000000-0000-000c-0000-000000000001', '45000000-0000-0000-0000-00000000000c', 'A', 'A', 'Figure A (Hexagon with 4 dots)', NULL, true, 0),
    ('46000000-0000-000c-0000-000000000002', '45000000-0000-0000-0000-00000000000c', 'B', 'B', 'Figure B (Heptagon with 3 dots)', NULL, false, 1),
    ('46000000-0000-000c-0000-000000000003', '45000000-0000-0000-0000-00000000000c', 'C', 'C', 'Figure C (Pentagon with 4 dots)', NULL, false, 2),
    ('46000000-0000-000c-0000-000000000004', '45000000-0000-0000-0000-00000000000c', 'D', 'D', 'Figure D (Hexagon with 5 dots)', NULL, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- nv-Q13
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, stem_image_url, explanation, time_limit_seconds, status, author_id, tags, cognitive_level, question_format, is_verified, bank_key, times_attempted, times_correct)
  VALUES ('45000000-0000-0000-0000-00000000000d', 'nv-Q13', v_subject_id, 'MEDIUM', 'Which figure is the odd one out among the four geometric shapes?', NULL, 'Figure C rotates counter-clockwise while all other figures rotate clockwise.', 30, 'APPROVED', v_author_id, ARRAY['Intelligence', 'Non-Verbal', 'Non-Verbal Intelligence', 'Shared Intelligence', 'TestDummy'], 'APPLYING', 'MCQ_SINGLE', true, 'nv', 0, 0)
  ON CONFLICT (id) DO UPDATE SET stem = EXCLUDED.stem, explanation = EXCLUDED.explanation;

  INSERT INTO public.question_options (id, question_id, option_key, label, text, image_url, is_correct, sort_order)
  VALUES
    ('46000000-0000-000d-0000-000000000001', '45000000-0000-0000-0000-00000000000d', 'A', 'A', 'Figure A (Clockwise curved arrow with single tail)', NULL, false, 0),
    ('46000000-0000-000d-0000-000000000002', '45000000-0000-0000-0000-00000000000d', 'B', 'B', 'Figure B (Clockwise curved arrow with double tail)', NULL, false, 1),
    ('46000000-0000-000d-0000-000000000003', '45000000-0000-0000-0000-00000000000d', 'C', 'C', 'Figure C (Counter-clockwise curved arrow with single tail)', NULL, true, 2),
    ('46000000-0000-000d-0000-000000000004', '45000000-0000-0000-0000-00000000000d', 'D', 'D', 'Figure D (Clockwise curved arrow with triple tail)', NULL, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- nv-Q14
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, stem_image_url, explanation, time_limit_seconds, status, author_id, tags, cognitive_level, question_format, is_verified, bank_key, times_attempted, times_correct)
  VALUES ('45000000-0000-0000-0000-00000000000e', 'nv-Q14', v_subject_id, 'MEDIUM', 'Select the correct lateral reflection (mirror image) of the given symbol along the vertical plane.', NULL, 'In vertical mirror reflection, left and right directions invert while top and bottom orientation remains preserved.', 30, 'APPROVED', v_author_id, ARRAY['Intelligence', 'Non-Verbal', 'Non-Verbal Intelligence', 'Shared Intelligence', 'TestDummy'], 'APPLYING', 'MCQ_SINGLE', true, 'nv', 0, 0)
  ON CONFLICT (id) DO UPDATE SET stem = EXCLUDED.stem, explanation = EXCLUDED.explanation;

  INSERT INTO public.question_options (id, question_id, option_key, label, text, image_url, is_correct, sort_order)
  VALUES
    ('46000000-0000-000e-0000-000000000001', '45000000-0000-0000-0000-00000000000e', 'A', 'A', 'Figure A (Right-facing flag with top-left shaded square)', NULL, false, 0),
    ('46000000-0000-000e-0000-000000000002', '45000000-0000-0000-0000-00000000000e', 'B', 'B', 'Figure B (Left-facing flag with top-right shaded square)', NULL, true, 1),
    ('46000000-0000-000e-0000-000000000003', '45000000-0000-0000-0000-00000000000e', 'C', 'C', 'Figure C (Inverted downward flag with bottom shaded square)', NULL, false, 2),
    ('46000000-0000-000e-0000-000000000004', '45000000-0000-0000-0000-00000000000e', 'D', 'D', 'Figure D (Unchanged identical flag)', NULL, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- nv-Q15
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, stem_image_url, explanation, time_limit_seconds, status, author_id, tags, cognitive_level, question_format, is_verified, bank_key, times_attempted, times_correct)
  VALUES ('45000000-0000-0000-0000-00000000000f', 'nv-Q15', v_subject_id, 'MEDIUM', 'Which 3D solid cube can be formed by folding the given flat cross net with labeled faces?', NULL, 'Opposite faces in the flat net cannot appear adjacent on the assembled cube. Only Cube A preserves valid adjacent face relationships.', 30, 'APPROVED', v_author_id, ARRAY['Intelligence', 'Non-Verbal', 'Non-Verbal Intelligence', 'Shared Intelligence', 'TestDummy'], 'APPLYING', 'MCQ_SINGLE', true, 'nv', 0, 0)
  ON CONFLICT (id) DO UPDATE SET stem = EXCLUDED.stem, explanation = EXCLUDED.explanation;

  INSERT INTO public.question_options (id, question_id, option_key, label, text, image_url, is_correct, sort_order)
  VALUES
    ('46000000-0000-000f-0000-000000000001', '45000000-0000-0000-0000-00000000000f', 'A', 'A', 'Cube A (Face with star adjacent to circle, circle adjacent to square)', NULL, true, 0),
    ('46000000-0000-000f-0000-000000000002', '45000000-0000-0000-0000-00000000000f', 'B', 'B', 'Cube B (Opposite faces star and triangle shown simultaneously adjacent)', NULL, false, 1),
    ('46000000-0000-000f-0000-000000000003', '45000000-0000-0000-0000-00000000000f', 'C', 'C', 'Cube C (Opposite faces square and cross shown simultaneously adjacent)', NULL, false, 2),
    ('46000000-0000-000f-0000-000000000004', '45000000-0000-0000-0000-00000000000f', 'D', 'D', 'Cube D (Inverted blank face with overlapping shading)', NULL, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- nv-Q16
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, stem_image_url, explanation, time_limit_seconds, status, author_id, tags, cognitive_level, question_format, is_verified, bank_key, times_attempted, times_correct)
  VALUES ('45000000-0000-0000-0000-000000000010', 'nv-Q16', v_subject_id, 'MEDIUM', 'Select the figure that logically completes the visual analogy: Shape 1 is to Shape 2 as Shape 3 is to ...', NULL, 'The rule inverts the internal shape from hollow to shaded and swaps relative proportions between outer frame and inner icon.', 30, 'APPROVED', v_author_id, ARRAY['Intelligence', 'Non-Verbal', 'Non-Verbal Intelligence', 'Shared Intelligence', 'TestDummy'], 'APPLYING', 'MCQ_SINGLE', true, 'nv', 0, 0)
  ON CONFLICT (id) DO UPDATE SET stem = EXCLUDED.stem, explanation = EXCLUDED.explanation;

  INSERT INTO public.question_options (id, question_id, option_key, label, text, image_url, is_correct, sort_order)
  VALUES
    ('46000000-0000-0010-0000-000000000001', '45000000-0000-0000-0000-000000000010', 'A', 'A', 'Figure A (Inverted shaded polygon with internal circle)', NULL, false, 0),
    ('46000000-0000-0010-0000-000000000002', '45000000-0000-0000-0000-000000000010', 'B', 'B', 'Figure B (Enlarged hollow outer polygon with inverted shaded inner triangle)', NULL, true, 1),
    ('46000000-0000-0010-0000-000000000010', '45000000-0000-0000-0000-000000000010', 'C', 'C', 'Figure C (Identical unshaded shape)', NULL, false, 2),
    ('46000000-0000-0010-0000-000000000010', '45000000-0000-0000-0000-000000000010', 'D', 'D', 'Figure D (Divided polygon with double cross)', NULL, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- nv-Q17
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, stem_image_url, explanation, time_limit_seconds, status, author_id, tags, cognitive_level, question_format, is_verified, bank_key, times_attempted, times_correct)
  VALUES ('45000000-0000-0000-0000-000000000011', 'nv-Q17', v_subject_id, 'MEDIUM', 'When the folded transparent square sheet with markings is unfolded, which pattern appears?', NULL, 'Unfolding a twice-folded sheet across both horizontal and vertical fold axes duplicates the punch mark symmetrically across all four quadrants.', 30, 'APPROVED', v_author_id, ARRAY['Intelligence', 'Non-Verbal', 'Non-Verbal Intelligence', 'Shared Intelligence', 'TestDummy'], 'APPLYING', 'MCQ_SINGLE', true, 'nv', 0, 0)
  ON CONFLICT (id) DO UPDATE SET stem = EXCLUDED.stem, explanation = EXCLUDED.explanation;

  INSERT INTO public.question_options (id, question_id, option_key, label, text, image_url, is_correct, sort_order)
  VALUES
    ('46000000-0000-0011-0000-000000000001', '45000000-0000-0000-0000-000000000011', 'A', 'A', 'Pattern A (Four symmetric quadrant perforations centered diagonally)', NULL, true, 0),
    ('46000000-0000-0011-0000-000000000002', '45000000-0000-0000-0000-000000000011', 'B', 'B', 'Pattern B (Two asymmetric horizontal slits on right edge)', NULL, false, 1),
    ('46000000-0000-0011-0000-000000000003', '45000000-0000-0000-0000-000000000011', 'C', 'C', 'Pattern C (Single central circular cutout)', NULL, false, 2),
    ('46000000-0000-0011-0000-000000000004', '45000000-0000-0000-0000-000000000011', 'D', 'D', 'Pattern D (Random scattered dots)', NULL, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- nv-Q18
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, stem_image_url, explanation, time_limit_seconds, status, author_id, tags, cognitive_level, question_format, is_verified, bank_key, times_attempted, times_correct)
  VALUES ('45000000-0000-0000-0000-000000000012', 'nv-Q18', v_subject_id, 'MEDIUM', 'Find the total number of straight lines required to construct the given overlapping polygon star diagram.', NULL, 'Counting the structural continuous segments: 8 outer boundary edges and 8 internal connecting diagonals yield exactly 16 straight lines.', 30, 'APPROVED', v_author_id, ARRAY['Intelligence', 'Non-Verbal', 'Non-Verbal Intelligence', 'Shared Intelligence', 'TestDummy'], 'APPLYING', 'MCQ_SINGLE', true, 'nv', 0, 0)
  ON CONFLICT (id) DO UPDATE SET stem = EXCLUDED.stem, explanation = EXCLUDED.explanation;

  INSERT INTO public.question_options (id, question_id, option_key, label, text, image_url, is_correct, sort_order)
  VALUES
    ('46000000-0000-0012-0000-000000000001', '45000000-0000-0000-0000-000000000012', 'A', 'A', '12 straight lines', NULL, false, 0),
    ('46000000-0000-0012-0000-000000000002', '45000000-0000-0000-0000-000000000012', 'B', 'B', '16 straight lines', NULL, true, 1),
    ('46000000-0000-0012-0000-000000000003', '45000000-0000-0000-0000-000000000012', 'C', 'C', '20 straight lines', NULL, false, 2),
    ('46000000-0000-0012-0000-000000000004', '45000000-0000-0000-0000-000000000012', 'D', 'D', '14 straight lines', NULL, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- nv-Q19
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, stem_image_url, explanation, time_limit_seconds, status, author_id, tags, cognitive_level, question_format, is_verified, bank_key, times_attempted, times_correct)
  VALUES ('45000000-0000-0000-0000-000000000013', 'nv-Q19', v_subject_id, 'MEDIUM', 'Which figure correctly completes the 90-degree counter-clockwise rotation of the compound shape?', NULL, 'A 90-degree counter-clockwise rotation turns a vertical stem horizontal, swinging the right-hand circle to the top position and left-hand square to the bottom.', 30, 'APPROVED', v_author_id, ARRAY['Intelligence', 'Non-Verbal', 'Non-Verbal Intelligence', 'Shared Intelligence', 'TestDummy'], 'APPLYING', 'MCQ_SINGLE', true, 'nv', 0, 0)
  ON CONFLICT (id) DO UPDATE SET stem = EXCLUDED.stem, explanation = EXCLUDED.explanation;

  INSERT INTO public.question_options (id, question_id, option_key, label, text, image_url, is_correct, sort_order)
  VALUES
    ('46000000-0000-0013-0000-000000000001', '45000000-0000-0000-0000-000000000013', 'A', 'A', 'Figure A (Horizontal bar with upper shaded circle and lower open square)', NULL, true, 0),
    ('46000000-0000-0013-0000-000000000002', '45000000-0000-0000-0000-000000000013', 'B', 'B', 'Figure B (Vertical bar with right shaded circle and left open square)', NULL, false, 1),
    ('46000000-0000-0013-0000-000000000003', '45000000-0000-0000-0000-000000000013', 'C', 'C', 'Figure C (Diagonal bar with reversed markers)', NULL, false, 2),
    ('46000000-0000-0013-0000-000000000004', '45000000-0000-0000-0000-000000000013', 'D', 'D', 'Figure D (Horizontal bar with lower shaded circle)', NULL, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- nv-Q20
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, stem_image_url, explanation, time_limit_seconds, status, author_id, tags, cognitive_level, question_format, is_verified, bank_key, times_attempted, times_correct)
  VALUES ('45000000-0000-0000-0000-000000000014', 'nv-Q20', v_subject_id, 'MEDIUM', 'Determine which piece fits into the empty missing space of the composite gear-teeth mandala.', NULL, 'The complementary interlocking boundary requires exactly two outward teeth and one matching central recess to complete the rotational symmetry.', 30, 'APPROVED', v_author_id, ARRAY['Intelligence', 'Non-Verbal', 'Non-Verbal Intelligence', 'Shared Intelligence', 'TestDummy'], 'APPLYING', 'MCQ_SINGLE', true, 'nv', 0, 0)
  ON CONFLICT (id) DO UPDATE SET stem = EXCLUDED.stem, explanation = EXCLUDED.explanation;

  INSERT INTO public.question_options (id, question_id, option_key, label, text, image_url, is_correct, sort_order)
  VALUES
    ('46000000-0000-0014-0000-000000000001', '45000000-0000-0000-0000-000000000014', 'A', 'A', 'Piece A (Sector with two outer convex teeth and one inner concave notch)', NULL, true, 0),
    ('46000000-0000-0014-0000-000000000002', '45000000-0000-0000-0000-000000000014', 'B', 'B', 'Piece B (Sector with three flat boundaries and no notches)', NULL, false, 1),
    ('46000000-0000-0014-0000-000000000003', '45000000-0000-0000-0000-000000000014', 'C', 'C', 'Piece C (Sector with inverted asymmetric triangular ridges)', NULL, false, 2),
    ('46000000-0000-0014-0000-000000000004', '45000000-0000-0000-0000-000000000014', 'D', 'D', 'Piece D (Solid unnotched circular sector)', NULL, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- Link course associations for nv-Q11 through nv-Q20
  INSERT INTO public.question_courses (question_id, course_id)
  SELECT q.id, c.id
  FROM public.questions q
  CROSS JOIN (
    SELECT id FROM public.courses
    WHERE id IN (
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000103',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000004'
    )
  ) c
  WHERE q.code IN ('nv-Q11', 'nv-Q12', 'nv-Q13', 'nv-Q14', 'nv-Q15', 'nv-Q16', 'nv-Q17', 'nv-Q18', 'nv-Q19', 'nv-Q20')
  ON CONFLICT (question_id, course_id) DO NOTHING;

END $$;
