getCurrentUser: async (): Promise<User | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email || '',
    name: profile?.name || '',
    handle: profile?.handle || '',
    avatarUrl: profile?.avatar_url || null,
    subscription: {
      status: profile?.subscription_status || 'trialing',
      trialEndDate: profile?.trial_end_date || null,
      nextBillingDate: null,
      isTrialActive: true,
      isSubscriptionActive: true,
      isAccessBlocked: false
    }
  };
},
