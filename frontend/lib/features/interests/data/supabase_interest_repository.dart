import 'package:nearme/features/interests/domain/interest.dart';
import 'package:nearme/features/interests/domain/interest_repository.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final class SupabaseInterestRepository implements InterestRepository {
  const SupabaseInterestRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<List<Interest>> getAvailableInterests() async {
    try {
      final rows = await _client
          .from('interests')
          .select('id, slug, name, icon_name')
          .eq('is_enabled', true)
          .order('sort_order');

      return rows.map(Interest.fromJson).toList(growable: false);
    } on PostgrestException catch (error) {
      throw InterestFailure(error.message);
    }
  }

  @override
  Future<Set<int>> getSelectedInterestIds() async {
    final userId = _requireUserId();

    try {
      final rows = await _client
          .from('user_interests')
          .select('interest_id')
          .eq('user_id', userId);

      return rows.map((row) => (row['interest_id']! as num).toInt()).toSet();
    } on PostgrestException catch (error) {
      throw InterestFailure(error.message);
    }
  }

  @override
  Future<void> replaceSelectedInterests(Set<int> interestIds) async {
    _requireUserId();

    try {
      await _client.rpc<void>(
        'replace_user_interests',
        params: <String, Object>{
          'selected_interest_ids': interestIds.toList(growable: false),
        },
      );
    } on PostgrestException catch (error) {
      throw InterestFailure(error.message);
    }
  }

  String _requireUserId() {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) {
      throw const InterestFailure('An authenticated user is required.');
    }
    return userId;
  }
}
