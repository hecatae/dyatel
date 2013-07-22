package Dyatel::Schema::Regs;

use strict;
use warnings;

use base 'DBIx::Class';

__PACKAGE__->load_components("Core");
__PACKAGE__->table("regs");
__PACKAGE__->add_columns(
  "userid",
  { data_type => "integer", default_value => undef, is_nullable => 0, size => 4 },
  "ts",
  {
    data_type => "timestamp with time zone",
    default_value => "now()",
    is_nullable => 1,
    size => 8,
  },
  "location",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 0,
    size => undef,
  },
  "expires",
  {
    data_type => "timestamp with time zone",
    default_value => undef,
    is_nullable => 1,
    size => 8,
  },
  "device",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
  "driver",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
  "ip_transport",
  {
    data_type => "text",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
  "ip_host",
  {
    data_type => "inet",
    default_value => undef,
    is_nullable => 1,
    size => undef,
  },
  "ip_port",
  { data_type => "integer", default_value => undef, is_nullable => 1, size => 4 },
  "audio",
  {
    data_type => "boolean",
    default_value => "true",
    is_nullable => 1,
    size => 1,
  },
);
__PACKAGE__->belongs_to("userid", "Dyatel::Schema::Users", { id => "userid" });


# Created by DBIx::Class::Schema::Loader v0.04006 @ 2013-07-19 13:00:00
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:W9UzS581lRv9rJGD1/K2ZA


# You can replace this text with custom content, and it will be preserved on regeneration
1;
