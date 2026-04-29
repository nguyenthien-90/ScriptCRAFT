export type Genre = 'Action' | 'Drama' | 'Comedy' | 'Sci-Fi' | 'Horror' | 'Thriller' | 'Romance' | 'Fantasy' | 'Documentary';

export interface ProjectState {
  id: string;
  title: string;
  genre: Genre;
  initialIdea: string;
  extraContext: string;
  duration: number; // in minutes
  questions: ClarificationQuestion[];
  answers: Record<string, string>;
  branches: StoryBranch[];
  selectedBranchId: string | null;
  acts: ScriptAct[];
  segments: ScriptSegment[];
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface StoryBranch {
  id: string;
  title: string;
  description: string;
}

export interface ScriptAct {
  title: string;
  description: string;
  plotPoints: PlotPoint[];
}

export interface PlotPoint {
  id: string;
  title: string;
  description: string;
}

export interface ScriptSegment {
  id: string;
  title: string;
  contentVi: string;
  contentEn: string;
  contentZh: string;
  plotPointId: string;
}
