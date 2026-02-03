export interface Evaluation {
  id: string;
  testCaseId: string;
  rating: 'good' | 'bad' | null;
  notes: string;
  reviewerId: string | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateEvaluationInput = Pick<Evaluation, 'testCaseId' | 'rating' | 'notes'>;
export type UpdateEvaluationInput = Partial<Pick<Evaluation, 'rating' | 'notes' | 'durationMs'>>;
