#!/usr/bin/perl -w
#
# (c) vir
#
# Last modified: 2014-01-28 15:47:40 +0400
#

use strict;
use warnings FATAL => 'uninitialized';
use IO::Select;
use IO::Socket;
use HTTP::Request;

{
	package EventSourceClient;
	use Socket qw( AF_INET sockaddr_in inet_ntoa );

	sub new
	{
		my $class = shift;
		my($fh, $req) = @_;

		my($port, $iaddr) = sockaddr_in($fh->connected);
		my $name = gethostbyaddr($iaddr, AF_INET);
		my $peer = "$name [".inet_ntoa($iaddr)."] at port $port";

		return bless { FH => $fh, PEER => $peer, REQ => $req }, $class;
	}

	sub fh { return shift->{FH}; }
	sub peer { return shift->{PEER}; }
	sub initial_response
	{
		my $self = shift;
		$self->fh->print("HTTP/1.1 200 OK\nContent-Type: text/event-stream\nCache-Control: no-cache\n");
		$self->fh->print("Access-Control-Allow-Origin: ".$self->{REQ}->header('Origin')) if $self->{REQ}->header('Origin');
		$self->fh->print("\n");
	}
}

my $lsn = IO::Socket::INET->new(Listen => 1, LocalPort => 8080, ReuseAddr => 1);
my $sel = IO::Select->new( $lsn );
my $timeout = 5.0;
my %clients;

for(;;) {
	my @ready = $sel->can_read($timeout);
	unless(@ready) {
		broadcast_event();
		next;
	}
	foreach my $fh (@ready) {
		if($fh == $lsn) {
			my $new = $lsn->accept;
			$new->autoflush(1);
			$sel->add($new);
		} else {
			if($clients{$fh->fileno}) {
				disconnect_client($fh);
				next;
			}
			eval {
				my $buf;
				sysread $fh, $buf, 8192 or die "Error reading request: $!\n";
				print "Request: $buf\n";
				my $req = HTTP::Request->parse($buf) or die "Bad request";
				if(check_request($req)) {
					my $cl = new EventSourceClient($fh, $req);
					$cl->initial_response();
					$clients{$fh->fileno} = $cl;
					print "New client from ".$cl->peer."\n";
				} else {
					$fh->print("HTTP/1.0 400 Bad request\n\nSomething is terribly wrong.\n");
					disconnect_client($fh);
				}
			};
			if($@) {
				warn $@;
				disconnect_client($fh);
			}
		}
	}
}

sub check_request
{
	my($req) = @_;
	print "Got ".$req->method." request for ".$req->uri."\n";
	return 1;
}

sub broadcast_event
{
	print "Broadcasting to ".scalar(keys %clients)." clients\n";
	foreach my $key(keys %clients) {
		my $fh = $clients{$key}->fh;
		if(IO::Select->new($fh)->can_write) {
			$fh->print("data: message\n\n") or warn "Can't write to client: $!";
		} else {
			disconnect_client($fh);
		}
	}
}

sub disconnect_client
{
	my($fh) = @_;
	print "Disconnecting client\n";
	delete $clients{$fh->fileno} if $clients{$fh->fileno};
	$sel->remove($fh);
	$fh->shutdown(2);
	$fh->close;
}




