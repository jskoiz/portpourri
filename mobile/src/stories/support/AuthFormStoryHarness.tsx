import React from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';

type StoryFieldErrors<T extends FieldValues> = Partial<Record<Path<T>, string | undefined>>;

type UseStoryFormOptions<T extends FieldValues> = {
  defaultValues: DefaultValues<T>;
  errors?: StoryFieldErrors<T>;
  resolver: Resolver<T>;
  values: T;
};

function useStableErrors<T extends FieldValues>(
  errors: StoryFieldErrors<T> | undefined,
): StoryFieldErrors<T> | undefined {
  const ref = React.useRef(errors);

  if (!shallowEqual(ref.current, errors)) {
    ref.current = errors;
  }

  return ref.current;
}

function shallowEqual<T extends FieldValues>(
  a: StoryFieldErrors<T> | undefined,
  b: StoryFieldErrors<T> | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a) as Array<Path<T>>;
  const keysB = Object.keys(b) as Array<Path<T>>;
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => a[key] === b[key]);
}

export function useStoryForm<T extends FieldValues>({
  defaultValues,
  errors,
  resolver,
  values,
}: UseStoryFormOptions<T>): UseFormReturn<T> {
  const form = useForm<T>({
    defaultValues,
    resolver,
  });

  const stableErrors = useStableErrors(errors);

  React.useEffect(() => {
    form.reset(values);
  }, [form, values]);

  React.useEffect(() => {
    form.clearErrors();
    for (const [field, message] of Object.entries(stableErrors ?? {})) {
      if (message) {
        form.setError(field as Path<T>, { type: 'manual', message: String(message) });
      }
    }
  }, [stableErrors, form]);

  return form;
}
