final class AppEnvironment {
  const AppEnvironment({
    required this.supabaseUrl,
    required this.supabasePublishableKey,
  });

  factory AppEnvironment.fromDartDefines() {
    return const AppEnvironment(
      supabaseUrl: String.fromEnvironment('SUPABASE_URL'),
      supabasePublishableKey: String.fromEnvironment(
        'SUPABASE_PUBLISHABLE_KEY',
      ),
    );
  }

  final String supabaseUrl;
  final String supabasePublishableKey;

  bool get isConfigured {
    return Uri.tryParse(supabaseUrl)?.hasScheme == true &&
        supabasePublishableKey.isNotEmpty;
  }
}
