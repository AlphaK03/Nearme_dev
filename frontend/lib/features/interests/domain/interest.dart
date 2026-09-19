final class Interest {
  const Interest({
    required this.id,
    required this.slug,
    required this.name,
    required this.iconName,
  });

  factory Interest.fromJson(Map<String, Object?> json) {
    return Interest(
      id: (json['id']! as num).toInt(),
      slug: json['slug']! as String,
      name: json['name']! as String,
      iconName: json['icon_name']! as String,
    );
  }

  final int id;
  final String slug;
  final String name;
  final String iconName;
}
