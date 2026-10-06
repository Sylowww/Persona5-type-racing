"use client";

import { useActionState, useState } from "react";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthSubmit } from "@/features/auth/components/auth-submit";
import { FormError } from "@/features/auth/components/form-error";
import { changeUsername, uploadAvatar, type ProfileError, type ProfileFormState } from "@/features/profile/actions";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { USERNAME_MAX } from "@/lib/auth/validation";
import { MAX_AVATAR_BYTES } from "@/lib/avatar";

const initialState: ProfileFormState = { error: null, saved: false };

type ProfileEditorProps = {
  dictionary: Dictionary["profile"]["edit"];
  username: string;
  avatarUrl: string | null;
  avatarAlt: string;
};

/** Display name and profile picture of the signed-in player. */
export function ProfileEditor({ dictionary, username, avatarUrl, avatarAlt }: ProfileEditorProps) {
  const [nameState, nameAction, namePending] = useActionState(changeUsername, initialState);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatar, initialState);
  // Checked in the browser too, so an oversized file is never sent (the server still checks it).
  const [tooLarge, setTooLarge] = useState(false);
  const avatarError: ProfileError | null = tooLarge ? "tooLarge" : avatarState.error;

  return (
    <section aria-labelledby="profile-edit-title" className="flex flex-col gap-4 bg-surface-container p-6 shadow-hard-xl">
      <h2 id="profile-edit-title" className="font-hud text-headline-sm font-black uppercase italic tracking-wider text-secondary">
        {dictionary.title}
      </h2>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <form action={nameAction} noValidate className="flex flex-col gap-2">
          <AuthField
            name="username"
            icon="person"
            autoComplete="username"
            maxLength={USERNAME_MAX}
            label={dictionary.username}
            hint={dictionary.usernameHint}
            defaultValue={username}
            error={nameState.error ? dictionary.errors[nameState.error] : undefined}
          />
          {nameState.saved && <p role="status" className="font-hud text-label-hud font-black uppercase text-secondary-fixed">{dictionary.saved}</p>}
          <AuthSubmit label={dictionary.saveUsername} pendingLabel={dictionary.pending} pending={namePending} />
        </form>

        <form
          action={avatarAction}
          onSubmit={(event) => {
            if (tooLarge) event.preventDefault();
          }}
          className="flex flex-col gap-2"
        >
          <span className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">{dictionary.avatar}</span>
          <div className="flex items-center gap-4">
            <PlayerAvatar avatarUrl={avatarUrl} alt={avatarAlt} size={72} className="shadow-hard-sm shadow-secondary" />
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="profile-avatar" className="sr-only">
                {dictionary.avatarInput}
              </label>
              <input
                id="profile-avatar"
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby="profile-avatar-hint"
                onChange={(event) => setTooLarge((event.target.files?.[0]?.size ?? 0) > MAX_AVATAR_BYTES)}
                className="w-full min-w-0 text-[13px] text-on-surface-variant file:mr-3 file:bg-surface-container-high file:px-3 file:py-1.5 file:font-hud file:text-label-hud file:font-black file:uppercase file:text-secondary hover:file:text-secondary-fixed"
              />
              <p id="profile-avatar-hint" className="text-[13px] text-on-surface-variant">
                {dictionary.avatarHint}
              </p>
            </div>
          </div>
          {avatarError && <FormError message={dictionary.errors[avatarError]} />}
          {avatarState.saved && !avatarError && (
            <p role="status" className="font-hud text-label-hud font-black uppercase text-secondary-fixed">{dictionary.saved}</p>
          )}
          <AuthSubmit label={dictionary.saveAvatar} pendingLabel={dictionary.pending} pending={avatarPending} />
        </form>
      </div>
    </section>
  );
}
