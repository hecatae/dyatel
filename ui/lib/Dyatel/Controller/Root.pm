package Dyatel::Controller::Root;
use Moose;
use namespace::autoclean;

BEGIN { extends 'Catalyst::Controller' }

#
# Sets the actions in this controller to be registered with no prefix
# so they function identically to actions created in MyApp.pm
#
__PACKAGE__->config(namespace => '');

=head1 NAME

Dyatel::Controller::Root - Root Controller for Dyatel

=head1 DESCRIPTION

[enter your description here]

=head1 METHODS

=head2 index

The root page (/)

=cut

sub index :Path :Args(0) {
	my( $self, $c ) = @_;

	my $href = $c->uri_for('/users/list');
	my $jsredir = << "***";
<html><head>
 <script type="text/javascript">
  document.location = "/spa";
 </script>
 <noscript>
  <meta http-equiv="refresh" content="0; url=$href">
 </noscript>
</head><body>
</body></html>
***
	$c->response->body( $jsredir );
}

=head2 default

Standard 404 error page

=cut

sub default :Path {
    my ( $self, $c ) = @_;
    $c->response->body( 'Page not found' );
    $c->response->status(404);
}

sub spa :Local {
	my($self, $c) = @_;
	$c->stash(template => 'spa.tt', no_wrapper => 1);
}

=head2 end

Attempt to render a view, if needed.

=cut

sub end : ActionClass('RenderView') {
	my($self, $c) = @_;
	if(($c->req->param('o')||'') eq 'json') {
		$c->stash(current_view => 'JSON');
#		$c->forward('View:JSON');
	}
}

=head1 AUTHOR

Vasily i. Redkin,,,

=head1 LICENSE

This library is free software. You can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

__PACKAGE__->meta->make_immutable;

1;
