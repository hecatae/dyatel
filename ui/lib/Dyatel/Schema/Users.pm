package Dyatel::Schema::Users;

use strict;
use warnings;

use base 'DBIx::Class';

__PACKAGE__->load_components("InflateColumn::Serializer", "Core");
__PACKAGE__->table("users");
__PACKAGE__->add_columns(
  "id",
  {
    data_type => "integer",
    default_value => "nextval('users_id_seq'::regclass)",
    is_nullable => 0,
    size => 4,
  },
  "num",
  {
    data_type => "phone",
    default_value => undef,
    is_nullable => 0,
    size => undef,
  },
  "alias",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
  "domain",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 0,
    size => undef,
  },
  "password",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 0,
    size => undef,
  },
  "lastreg",
  {
    data_type => "timestamp with time zone",
    default_value => undef,
    is_nullable => 1,
    size => 8,
  },
  "lastip",
  {
    data_type => "inet",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
  "nat_support",
  { data_type => "boolean", default_value => undef, is_nullable => 1, size => 1 },
  "nat_port_support",
  { data_type => "boolean", default_value => undef, is_nullable => 1, size => 1 },
  "media_bypass",
  {
    data_type => "boolean",
    default_value => "false",
    is_nullable => 1,
    size => 1,
  },
  "dispname",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
  "login",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
  "badges",
  {
    data_type => "text[]",
    default_value => "'{}'::text[]",
    is_nullable => 0,
    size => undef,
  },
  "fingrp",
  { data_type => "integer", default_value => undef, is_nullable => 1, size => 4 },
  "secure",
  {
    data_type => "enum",
    default_value => "ssl",
    extra => { custom_type_name => "encription_mode", list => ["off", "on", "ssl"] },
    is_nullable => 0,
  },
);
__PACKAGE__->set_primary_key("id");
__PACKAGE__->add_unique_constraint("users_num_index", ["num"]);
__PACKAGE__->add_unique_constraint("users_pkey", ["id"]);
__PACKAGE__->has_many(
  "abbrs",
  "Dyatel::Schema::Abbrs",
  { "foreign.owner" => "self.id" },
);
__PACKAGE__->has_many("blfs", "Dyatel::Schema::Blfs", { "foreign.uid" => "self.id" });
__PACKAGE__->has_many(
  "linetrackers",
  "Dyatel::Schema::Linetracker",
  { "foreign.uid" => "self.id" },
);
__PACKAGE__->has_many(
  "morenums",
  "Dyatel::Schema::Morenums",
  { "foreign.uid" => "self.id" },
);
__PACKAGE__->has_many(
  "offlinemsgs",
  "Dyatel::Schema::Offlinemsgs",
  { "foreign.uid" => "self.id" },
);
__PACKAGE__->has_many(
  "phonebooks",
  "Dyatel::Schema::Phonebook",
  { "foreign.owner" => "self.id" },
);
__PACKAGE__->has_many(
  "pickupgrpmembers",
  "Dyatel::Schema::Pickupgrpmembers",
  { "foreign.uid" => "self.id" },
);
__PACKAGE__->has_many(
  "privdatas",
  "Dyatel::Schema::Privdata",
  { "foreign.uid" => "self.id" },
);
__PACKAGE__->has_many(
  "provisions",
  "Dyatel::Schema::Provision",
  { "foreign.uid" => "self.id" },
);
__PACKAGE__->has_many(
  "regs",
  "Dyatel::Schema::Regs",
  { "foreign.userid" => "self.id" },
);
__PACKAGE__->has_many(
  "rosters",
  "Dyatel::Schema::Roster",
  { "foreign.uid" => "self.id" },
);
__PACKAGE__->has_many(
  "sessions",
  "Dyatel::Schema::Sessions",
  { "foreign.uid" => "self.id" },
);
__PACKAGE__->belongs_to("num", "Dyatel::Schema::Directory", { num => "num" });
__PACKAGE__->belongs_to("fingrp", "Dyatel::Schema::Fingroups", { id => "fingrp" });
__PACKAGE__->has_many(
  "vcards",
  "Dyatel::Schema::Vcards",
  { "foreign.uid" => "self.id" },
);


# Created by DBIx::Class::Schema::Loader v0.04006 @ 2014-02-26 00:20:06
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:uYmL7VBqcfSa5tl0haDeZg


# You can replace this text with custom content, and it will be preserved on regeneration

__PACKAGE__->belongs_to("fingrp", "Dyatel::Schema::Fingroups", { id => "fingrp" }, { join_type => 'left' });

1;
