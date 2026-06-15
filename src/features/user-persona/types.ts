export type PersonaGender = 'male' | 'female' | 'other';

export type UserPersonaForm = {
  personaId: string | null;
  name: string;
  gender: PersonaGender;
  profile: string;
  avatarResourceId: string;
};
