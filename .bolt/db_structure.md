## Users Table
Description: A table that contains the relevant information for a given user. 
```
create table public.users (
  id uuid not null default gen_random_uuid (),
  email text not null,
  name text null,
  profile_pic_url text null,
  assessment_data jsonb null,
  last_t_level_estimate_id uuid null,
  current_streak integer null default 0,
  notifications jsonb null default '{"habit_nudges": true, "daily_reminder": true, "weekly_progress": true}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_auth_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
```

## Habits Table 
Description: A public dim table that contains all of the details of the habits that we have in our app.  
```
create table public.habits (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  category text null,
  is_removable boolean null default true,
  created_by_admin boolean null default false,
  created_at timestamp with time zone null default now(),
  is_active boolean not null default true,
  why_it_matters text null,
  impact smallint not null,
  icon text null,
  default_freq text not null,
  constraint habits_pkey primary key (id),
  constraint frequency_valid_check check (
    (
      (default_freq = 'Daily'::text)
      or (default_freq ~ '^[1-7]x Per Week$'::text)
    )
  )
) TABLESPACE pg_default;
```

## User Habits Table
Description: A fact table that indicates what habits are enabled for a user
```
create table public.user_habits (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  habit_id uuid null,
  custom_name text null,
  frequency text null,
  started_at timestamp with time zone not null default now(),
  is_active boolean null default true,
  source text null default 'manual'::text,
  ended_at timestamp with time zone null,
  constraint user_habits_pkey primary key (id),
  constraint user_habits_habit_id_fkey foreign KEY (habit_id) references habits (id),
  constraint user_habits_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint frequency_valid_check check (
    (
      (frequency = 'Daily'::text)
      or (frequency ~ '^[1-7]x Per Week$'::text)
    )
  )
) TABLESPACE pg_default;
```

## Habit Recommendations Table
Description: This fact table recommends habits to a given user 
``` 
create table public.habit_recommendations (
  criteria text null,
  reason text null,
  habit_id uuid not null default gen_random_uuid (),
  user_id uuid not null default gen_random_uuid (),
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  status character varying null default 'recommended'::character varying,
  updated_at timestamp with time zone null default now(),
  constraint habit_recommendations_pkey primary key (id),
  constraint habit_recommendations_habit_id_fkey foreign KEY (habit_id) references habits (id) on delete CASCADE,
  constraint habit_recommendations_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;
```


