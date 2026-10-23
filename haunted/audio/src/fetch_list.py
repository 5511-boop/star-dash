# Downloads the approved CC0 previews into samples/ (name = what render.py loads).
import sys, time
from freesound import get
PICKS = {
 'l2_laugh1': 559977, 'l2_laugh2': 487405,
 'l3_ticktock': 759503, 'l3_bells_far': 703590, 'l3_levers': 843093,
 'l4_waves': 803679, 'l4_gulls': 637813, 'l4_foghorn': 507471,
 'l5_storm': 628850, 'l5_chorus': 437475, 'l5_bell': 390203,
 'l6_frogs_night': 503206, 'l6_crow': 741366,
 'l7_rumble': 576962, 'l7_steam_far': 473905, 'l7_clack': 480813,
 'l8_soprano': 681474, 'l8_creak': 504026,
 'l9_organ': 477373, 'l9_bell': 578543, 'l9_chant': 787598,
 'l10_singing_glass': 447778, 'l10_glass_ring': 716907, 'l10_rev_breath': 181889,
 'l11_pages': 795507, 'l11_page': 457916,
 'l12_musicbox': 505166, 'l12_windup': 366083, 'l12_machine': 338366,
 'l13_drips': 162116, 'l13_rumble': 632682, 'l13_pick': 269696,
 'l14_chimes': 667173, 'l14_swallows': 543683,
 'l15_sahara': 557552, 'l15_tomb': 683464, 'l15_ney': 440816,
 'l16_vinyl': 434822, 'l16_candle': 708071, 'l16_waltz_box': 150027,
 'l17_cave': 839819, 'l17_whale': 695925, 'l17_sonar': 653896,
 'l18_fire': 679405, 'l18_anvil': 669696, 'l18_lava': 474851,
 'l19_musicbox': 417446, 'l19_whispers': 466658, 'l19_pad': 554829,
 'l20_heart': 382025, 'l20_presence': 657652, 'l20_creak': 590161,
 # second pass: substitutes for gaps + extras (original pieces / non-music recordings, avoiding copyrighted songs)
 'l2_calliope': 815135, 'l2_circus': 329789, 'l2_clown_horn': 405155, 'l2_clown_laugh1': 808416, 'l2_clown_laugh2': 263708, 'l2_ride_mech': 675548,
 'l8_tuning': 588399, 'l8_murmur': 850562, 'l8_ghost_sing': 128249, 'l8_remorse': 651683,
 'l16_gramophone': 609698, 'l16_radio_box': 258174,
 'l12_squeak': 468444, 'l12_toy_piano': 449787, 'l12_vintage_box': 613084,
 'l10_glass_break': 566453, 'l19_rev_piano': 648909, 'l11_quill': 856167, 'l5_monks': 274835,
 'l6_mud': 456806, 'l18_bellows': 567083, 'l18_steam': 365071, 'l7_horn': 591824, 'l20_floorboards': 802595, 'l20_footsteps': 817482,
}
if __name__ == '__main__':
    only = sys.argv[1:]; tot = 0
    for name, sid in PICKS.items():
        if only and name not in only: continue
        try: p, n = get(sid, name); tot += n; print('ok  %-18s %6d KB' % (name, n // 1024))
        except Exception as e: print('ERR %-18s %s' % (name, e))
        time.sleep(1.1)
    print('total %.1f MB' % (tot / 1048576))
