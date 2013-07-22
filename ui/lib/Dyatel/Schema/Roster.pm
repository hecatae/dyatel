package Dyatel::Schema::Roster;

use strict;
use warnings;

use base 'DBIx::Class';

__PACKAGE__->load_components("Core");
__PACKAGE__->table("roster");
__PACKAGE__->add_columns(
  "uid",
  { data_type => "integer", default_value => undef, is_nullable => 0, size => 4 },
  "contact",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 0,
    size => undef,
  },
  "subscription",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
  "label",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
  "groups",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
);
__PACKAGE__->belongs_to("uid", "Dyatel::Schema::Users", { id => "uid" });


# Created by DBIx::Class::Schema::Loader v0.04006 @ 2013-07-19 13:00:00
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:XVoR9/WSHI8UUnd/F1Eeww


# You can replace this text with custom content, and it will be preserved on regeneration
1;