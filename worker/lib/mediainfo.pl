#!/usr/bin/perl

use strict;
use Mojo::DOM;
use JSON;

my $default_lang = '';

my $file = $ARGV[0];
die('file does not exist') unless -e $file;
my $xml = `mediainfo -f --Output=XML "$file"`;

print $xml."\n" if $ARGV[1] eq '--debug';

my $dom = Mojo::DOM->new($xml);
my $ret = {};

my $gen = $dom->find('track[type="General"]')->first;
$ret->{duration} = numeric($gen, 'Duration');
$ret->{bps} = numeric($gen, 'OverallBitRate');
$ret->{format} = lc(shortest($gen, 'FileExtension'));
$ret->{streamable} = boolean($gen, 'IsStreamable');
$ret->{chapters} = [];
my $menus = $dom->find('track[type="Menu"] extra');
if (scalar @$menus > 0) {
  my $menu = $menus->first;
  $menu->children->each(sub {
    my $e = shift;
    if ($e->tag =~ m/^_(\d+)_(\d+)_(\d+)_(\d+)$/i) {
      my $chapter = {};
      $chapter->{marker} = $1*3600+$2*60+$3/1000.0;
      my ($lang, $title) = split(/\:/, $e->text, 2);
      $chapter->{title} = $title || $e->text;
      push(@{$ret->{chapters}}, $chapter);
    }
  });
}

my $v = {};
my $video = $dom->find('track[type="Video"]')->first;
$v->{format} = lc(shortest($video, 'Format'));
$v->{format} = 'mpeg2' if shortest($video, 'CodecID') eq 'V_MPEG2';
$v->{frames} = numeric($video, 'FrameCount');
$v->{width} = numeric($video, 'Stored_Width') || numeric($video, 'Width');
$v->{height} = numeric($video, 'Stored_Height') || numeric($video, 'Height');
$v->{duration} = numeric($video, 'Duration') || timelength($video, 'FromStats_Duration');
$v->{displayratio} = numeric($video, 'DisplayAspectRatio') || ($v->{height} ? $v->{width} / $v->{height} : 16.0/9.0);
$v->{display_height} = $v->{height};
$v->{display_width} = int(0.5 + $v->{displayratio} * $v->{display_height});
$v->{mode} = lc(shortest($video, 'FrameRate_Mode'));
$v->{bps} = numeric($video, 'BitRate') || numeric($video, 'FromStats_BitRate');
$v->{fps} = numeric($video, 'FrameRate') || numeric($video, 'FrameRateOriginal');
$v->{colordepth} = numeric($video, 'BitDepth');
$v->{interlaced} = lc(longest($video, 'ScanType')) eq 'interlaced' ? JSON::true : JSON::false;
$v->{language} = lc(target($video, 'Language', 2)) || $default_lang;
$v->{default} = boolean($video, 'Default');
$v->{forced} = boolean($video, 'Forced');
$ret->{video} = $v;

$ret->{audio} = [];
foreach my $audio (@{$dom->find('track[type="Audio"]')}) {
  my $entry = {};
  $entry->{track} = scalar(@{$ret->{audio}})+1;
  $entry->{title} = longest($audio, 'Title');
  $entry->{language} = target($audio, 'Language', 2) || $default_lang;
  $entry->{format} = lc(shortest($audio, 'Format'));
  $entry->{default} = boolean($audio, 'Default');
  $entry->{forced} = boolean($audio, 'Forced');
  $entry->{duration} = numeric($audio, 'Duration') || timelength($audio, 'FromStats_Duration');
  $entry->{mode} = lc(shortest($audio, 'BitRate_Mode'));
  $entry->{channels} = numeric($audio, 'Channels_Original') || fuzzynumeric($audio, 'Channels');
  $entry->{samplerate} = numeric($audio, 'SamplingRate');
  $entry->{bps} = numeric($audio, 'BitRate') || numeric($audio, 'FromStats_BitRate');
  push (@{$ret->{audio}}, $entry);
}

$ret->{text} = [];
foreach my $sub (@{$dom->find('track[type="Text"]')}) {
  my $entry = {};
  $entry->{track} = scalar(@{$ret->{text}})+1;
  $entry->{title} = longest($sub, 'Title');
  $entry->{frames} = numeric($sub, 'FrameCount') || numeric($sub, 'ElementCount') || numeric($sub, 'FromStats_FrameCount');
  $entry->{bytes} = numeric($sub, 'NUMBER_OF_BYTES') || numeric($sub, 'StreamSize') || numeric($sub, 'FromStats_StreamSize');
  $entry->{duration} = timelength($sub, 'DURATION') || numeric($sub, 'Duration') || timelength($sub, 'FromStats_Duration');
  $entry->{language} = target($sub, 'Language', 2) || $default_lang;
  $entry->{format} = lc(shortest($sub, 'Format'));
  $entry->{default} = boolean($sub, 'Default');
  $entry->{forced} = boolean($sub, 'Forced');
  $entry->{foreign} = $entry->{frames} && 2.0 * $entry->{frames} / $ret->{duration} < 0.15 ? JSON::true : JSON::false;
  push (@{$ret->{text}}, $entry);
}

print JSON->new->pretty(1)->canonical(1)->utf8->encode($ret) . "\n";

sub shortest {
  my $element = shift;
  my $selector = shift;
  my $arr = $element->find($selector);
  return '' if $arr->size == 0;
  return $arr->reduce(sub {
    length($a->text) < length($b->text) ? $a : $b
  })->text;
}
sub longest {
  my $element = shift;
  my $selector = shift;
  my $arr = $element->find($selector);
  return '' if $arr->size == 0;
  return $arr->reduce(sub {
    length($a->text) > length($b->text) ? $a : $b
  })->text;
}
sub target {
  my $element = shift;
  my $selector = shift;
  my $target = shift;
  my $arr = $element->find($selector);
  return '' if $arr->size == 0;
  my $ret = $arr->reduce(sub {
    abs(length($a->text)-$target) < abs(length($b->text)-$target) ? $a : $b
  })->text;
  return '' if $ret eq 'null';
  return $ret;
}
sub boolean {
  my $element = shift;
  my $selector = shift;
  my $arr = $element->find($selector);
  return JSON::false if $arr->size == 0;
  return $arr->reduce(sub {
    $a || lc($b->text) eq 'yes' ? JSON::true : JSON::false
  }, JSON::false);
}
sub numeric {
  my $element = shift;
  my $selector = shift;
  my $arr = $element->find($selector);
  return 0 if $arr->size == 0;
  return $arr->reduce(sub {
    $b->text =~ m/^(\d+(\.\d+)?)$/i;
    return $a || $1;
  }, 0)+0;
}
sub fuzzynumeric {
  my $element = shift;
  my $selector = shift;
  my $arr = $element->find($selector);
  return 0 if $arr->size == 0;
  return $arr->reduce(sub {
    $b->text =~ m/(\d+(\.\d+)?)/i;
    return $a || $1;
  }, 0)+0;
}
sub timelength {
  my $element = shift;
  my $selector = shift;
  my $arr = $element->find($selector);
  return 0 if $arr->size == 0;
  return $arr->reduce(sub {
    $b->text =~ m/(\d+):(\d+):(\d+)\.(\d+)/i;
    return $a || $1*3600+$2*60+$3+$4/(10.0**length($4));
  }, 0);
}
