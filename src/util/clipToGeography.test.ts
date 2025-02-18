import { clipToGeography } from "./clipToGeography.js";
import project from "../../project/projectClient.js";
import { bbox, area } from "@turf/turf";
import {
  Polygon,
  Sketch,
  genSampleSketch,
  genSketchCollection,
} from "@seasketch/geoprocessing";
import { describe, test, expect } from "vitest";

const sketch: Sketch<Polygon> = genSampleSketch<Polygon>(
  {
    type: "Polygon",
    coordinates: [
      [
        [158.224_950_413_640_24, 6.975_617_220_487_638_5],
        [158.225_024, 6.975_545],
        [158.225_225, 6.975_253],
        [158.225_548, 6.974_825],
        [158.225_788, 6.974_65],
        [158.226_185, 6.974_247],
        [158.226_401, 6.974_004],
        [158.226_425, 6.973_833],
        [158.226_513, 6.973_556],
        [158.226_582, 6.973_415],
        [158.226_827, 6.973_303],
        [158.226_92, 6.973_056],
        [158.227_106, 6.972_842],
        [158.227_14, 6.972_637],
        [158.227_449, 6.972_647],
        [158.227_944, 6.972_423],
        [158.228_125, 6.972_205],
        [158.228_478, 6.971_694],
        [158.228_776, 6.971_232],
        [158.228_781, 6.971_043],
        [158.228_713, 6.970_819],
        [158.228_879, 6.970_571],
        [158.229_183, 6.970_435],
        [158.229_486, 6.970_177],
        [158.229_648, 6.969_944],
        [158.229_604, 6.969_691],
        [158.229_79, 6.969_584],
        [158.230_079, 6.969_487],
        [158.230_475, 6.969_009],
        [158.230_441, 6.968_73],
        [158.230_596, 6.968_795],
        [158.231_083, 6.968_596],
        [158.231_687, 6.968_534],
        [158.232_021, 6.968_598],
        [158.232_478, 6.968_268],
        [158.232_462, 6.967_888],
        [158.232_735, 6.967_766],
        [158.233_143, 6.967_495],
        [158.233_266, 6.967_444],
        [158.233_62, 6.967_157],
        [158.233_615, 6.967_013],
        [158.234_117, 6.966_861],
        [158.234_413, 6.966_656],
        [158.234_546, 6.966_748],
        [158.234_79, 6.966_164],
        [158.235_076, 6.965_91],
        [158.235_315, 6.965_524],
        [158.235_803, 6.965_135],
        [158.236_076, 6.965_035],
        [158.236_587, 6.964_346],
        [158.236_75, 6.963_959],
        [158.236_485, 6.963_742],
        [158.236_775, 6.963_552],
        [158.237_632, 6.963_268],
        [158.237_853, 6.962_992],
        [158.237_967, 6.962_795],
        [158.237_941, 6.962_677],
        [158.237_754, 6.962_148],
        [158.237_839, 6.961_777],
        [158.238_039, 6.961_523],
        [158.238_107, 6.960_872],
        [158.238_216, 6.960_878],
        [158.238_329, 6.960_72],
        [158.238_363, 6.960_323],
        [158.238_303, 6.960_166],
        [158.238_408, 6.960_126],
        [158.238_502, 6.960_108],
        [158.238_679, 6.960_04],
        [158.238_924, 6.959_892],
        [158.238_989, 6.959_792],
        [158.239_071, 6.959_683],
        [158.239_058, 6.959_578],
        [158.239_025, 6.959_55],
        [158.239_016, 6.9595],
        [158.239_078, 6.959_498],
        [158.239_154, 6.959_446],
        [158.239_204, 6.959_336],
        [158.239_29, 6.959_202],
        [158.239_369, 6.959_09],
        [158.239_373, 6.959_027],
        [158.239_481, 6.958_898],
        [158.239_513, 6.958_839],
        [158.239_511, 6.958_776],
        [158.239_554, 6.958_702],
        [158.239_573, 6.958_626],
        [158.239_602, 6.958_542],
        [158.239_624, 6.958_411],
        [158.239_605, 6.958_38],
        [158.239_622, 6.958_346],
        [158.239_623, 6.958_233],
        [158.239_604, 6.958_08],
        [158.239_56, 6.957_988],
        [158.239_566, 6.957_929],
        [158.239_541, 6.957_874],
        [158.239_532, 6.957_828],
        [158.239_506, 6.957_775],
        [158.239_488, 6.957_743],
        [158.239_454, 6.957_744],
        [158.239_45, 6.957_685],
        [158.239_417, 6.957_613],
        [158.239_407, 6.957_534],
        [158.239_368, 6.957_475],
        [158.239_311, 6.957_427],
        [158.239_261, 6.957_423],
        [158.239_181, 6.9573],
        [158.239_11, 6.957_101],
        [158.239_136, 6.957_053],
        [158.239_09, 6.956_939],
        [158.239_024, 6.956_873],
        [158.238_949, 6.956_838],
        [158.238_888, 6.956_844],
        [158.238_896, 6.956_746],
        [158.238_806, 6.956_611],
        [158.238_802, 6.956_553],
        [158.238_78, 6.956_508],
        [158.238_736, 6.956_484],
        [158.238_726, 6.956_369],
        [158.238_684, 6.956_273],
        [158.238_645, 6.956_247],
        [158.238_615, 6.956_121],
        [158.238_562, 6.956_035],
        [158.238_509, 6.955_916],
        [158.238_447, 6.955_889],
        [158.238_382, 6.955_887],
        [158.238_389, 6.955_804],
        [158.238_417, 6.955_752],
        [158.238_428, 6.955_62],
        [158.238_423, 6.955_467],
        [158.238_411, 6.955_366],
        [158.238_368, 6.955_319],
        [158.238_362, 6.955_278],
        [158.238_444, 6.955_252],
        [158.238_497, 6.955_172],
        [158.238_543, 6.955_131],
        [158.238_548, 6.955_086],
        [158.238_584, 6.955_062],
        [158.238_625, 6.954_982],
        [158.238_626, 6.954_922],
        [158.238_666, 6.954_846],
        [158.238_684, 6.954_797],
        [158.238_69, 6.954_744],
        [158.238_674, 6.954_686],
        [158.238_644, 6.954_626],
        [158.238_619, 6.954_625],
        [158.238_594, 6.954_599],
        [158.238_568, 6.954_576],
        [158.238_56, 6.954_542],
        [158.238_554, 6.954_518],
        [158.238_58, 6.954_511],
        [158.238_628, 6.954_592],
        [158.238_689, 6.954_656],
        [158.238_706, 6.954_663],
        [158.238_72, 6.954_679],
        [158.238_761, 6.954_687],
        [158.238_808, 6.954_671],
        [158.238_852, 6.954_666],
        [158.238_864, 6.954_708],
        [158.238_906, 6.954_745],
        [158.238_937_702_450_04, 6.954_760_233_644_836],
        [159.394_570_106_311_85, 8.570_788_747_446_58],
        [159.346_807_759_993_65, 8.614_032_490_174_239],
        [158.224_950_413_640_24, 6.975_617_220_487_638_5],
      ],
      [
        [158.244_462, 6.992_755],
        [158.244_629, 6.992_846],
        [158.244_705, 6.992_967],
        [158.244_864, 6.993_298],
        [158.245_146, 6.993_977],
        [158.244_986, 6.994_196],
        [158.244_933, 6.994_482],
        [158.244_956, 6.994_777],
        [158.244_902, 6.995_048],
        [158.244_925, 6.995_289],
        [158.245_024, 6.995_659],
        [158.245_26, 6.996_066],
        [158.245_26, 6.996_255],
        [158.245_184, 6.996_353],
        [158.245_001, 6.996_73],
        [158.244_994, 6.997_024],
        [158.245_039, 6.997_552],
        [158.245_206, 6.997_899],
        [158.245_328, 6.998_268],
        [158.245_541, 6.998_653],
        [158.245_26, 6.998_894],
        [158.245_366, 6.999_188],
        [158.245_533, 6.999_384],
        [158.245_685, 6.999_467],
        [158.245_921, 6.999_762],
        [158.246_012, 6.999_973],
        [158.245_921, 7.000_327],
        [158.245_905, 7.000_825],
        [158.246_065, 7.000_87],
        [158.246_316, 7.000_998],
        [158.246_452, 7.001_504],
        [158.246_589, 7.001_715],
        [158.246_574, 7.001_866],
        [158.246_452, 7.002_198],
        [158.246_528, 7.002_341],
        [158.246_848, 7.002_416],
        [158.247_106, 7.002_605],
        [158.247_152, 7.002_922],
        [158.247_19, 7.003_125],
        [158.247_532, 7.003_472],
        [158.247_235, 7.003_442],
        [158.246_825, 7.003_336],
        [158.246_696, 7.003_276],
        [158.246_392, 7.003_065],
        [158.246_194, 7.003_012],
        [158.246_019, 7.002_778],
        [158.245_951, 7.002_665],
        [158.245_746, 7.002_635],
        [158.245_381, 7.002_703],
        [158.245_222, 7.002_922],
        [158.245_427, 7.003_027],
        [158.245_343, 7.003_276],
        [158.245_465, 7.003_449],
        [158.245_602, 7.003_676],
        [158.245_723, 7.004_234],
        [158.245_723, 7.004_505],
        [158.245_708, 7.004_928],
        [158.245_761, 7.005_207],
        [158.245_89, 7.005_561],
        [158.246_247, 7.005_87],
        [158.246_49, 7.006_044],
        [158.246_924, 7.006_308],
        [158.247_478, 7.006_934],
        [158.247_752, 7.007_258],
        [158.248_162, 7.007_409],
        [158.248_534, 7.007_537],
        [158.248_709, 7.007_537],
        [158.249_142, 7.007_658],
        [158.249_484, 7.007_801],
        [158.249_636, 7.007_695],
        [158.249_811, 7.007_56],
        [158.249_902, 7.007_718],
        [158.249_993, 7.008_072],
        [158.250_221, 7.008_299],
        [158.250_35, 7.008_442],
        [158.250_654, 7.008_495],
        [158.251_087, 7.008_472],
        [158.251_255, 7.008_51],
        [158.251_657, 7.008_751],
        [158.252_068, 7.008_751],
        [158.252_258, 7.008_668],
        [158.252_303, 7.008_766],
        [158.252_349, 7.008_992],
        [158.252_432, 7.009_286],
        [158.252_577, 7.009_558],
        [158.252_759, 7.009_777],
        [158.253_04, 7.009_98],
        [158.253_422, 7.010_343],
        [158.253_574, 7.010_45],
        [158.253_68, 7.010_601],
        [158.253_844, 7.010_725],
        [158.254_204, 7.010_896],
        [158.254_545, 7.011_162],
        [158.254_878, 7.011_225],
        [158.255_197, 7.011_301],
        [158.255_485, 7.011_506],
        [158.255_682, 7.011_123],
        [158.255_811, 7.010_712],
        [158.256_009, 7.010_552],
        [158.256_008, 7.010_262],
        [158.256_209, 7.010_026],
        [158.256_406, 7.009_799],
        [158.256_444, 7.009_603],
        [158.256_429, 7.009_324],
        [158.256_482, 7.009_113],
        [158.256_657, 7.008_774],
        [158.256_672, 7.008_691],
        [158.256_778, 7.008_344],
        [158.257_029, 7.008_178],
        [158.257_067, 7.008_08],
        [158.257_196, 7.007_59],
        [158.257_364, 7.007_431],
        [158.257_424, 7.007_213],
        [158.257_63, 7.007_115],
        [158.257_85, 7.006_911],
        [158.257_819, 7.006_654],
        [158.257_979, 7.006_391],
        [158.257_971, 7.006_074],
        [158.257_994, 7.005_772],
        [158.257_944, 7.005_394],
        [158.258_303, 7.005_229],
        [158.258_373, 7.005_085],
        [158.258_293, 7.004_867],
        [158.258_334, 7.004_679],
        [158.258_416, 7.004_111],
        [158.258_277, 7.003_988],
        [158.258_309, 7.003_829],
        [158.258_357, 7.003_887],
        [158.258_663, 7.003_706],
        [158.258_77, 7.003_254],
        [158.258_936, 7.0023],
        [158.258_695, 7.002_189],
        [158.258_545, 7.002_247],
        [158.258_325, 7.002_284],
        [158.258_362, 7.002_119],
        [158.258_663, 7.001_997],
        [158.258_969, 7.001_954],
        [158.258_99, 7.001_667],
        [158.259_054, 7.001_23],
        [158.258_915, 7.000_842],
        [158.258_831, 7.000_126],
        [158.258_625, 6.999_723],
        [158.258_467, 6.999_385],
        [158.258_423, 6.999_292],
        [158.258_461, 6.999_142],
        [158.258_498, 6.999_02],
        [158.258_364, 6.998_876],
        [158.258_214, 6.998_689],
        [158.258_079, 6.998_492],
        [158.257_596, 6.998_081],
        [158.257_418, 6.997_958],
        [158.257_214, 6.997_894],
        [158.256_967, 6.997_772],
        [158.256_844, 6.997_574],
        [158.256_817, 6.997_414],
        [158.256_446, 6.996_993],
        [158.256_21, 6.996_993],
        [158.256_022, 6.997_132],
        [158.255_989, 6.996_961],
        [158.255_882, 6.996_759],
        [158.255_651, 6.996_615],
        [158.255_463, 6.996_529],
        [158.255_28, 6.996_513],
        [158.254_995, 6.996_663],
        [158.254_77, 6.996_743],
        [158.254_437, 6.996_753],
        [158.254_227, 6.996_743],
        [158.254_098, 6.996_689],
        [158.253_894, 6.996_876],
        [158.253_856, 6.997_057],
        [158.253_985, 6.997_142],
        [158.254_27, 6.997_174],
        [158.254_265, 6.997_356],
        [158.254_184, 6.997_649],
        [158.254_136, 6.998_001],
        [158.254_146, 6.998_145],
        [158.254_222, 6.998_326],
        [158.254_378, 6.998_529],
        [158.254_367, 6.998_826],
        [158.253_798, 6.998_789],
        [158.253_57, 6.998_485],
        [158.253_134, 6.998_297],
        [158.253_26, 6.998_11],
        [158.253_42, 6.998_057],
        [158.253_458, 6.997_921],
        [158.253_39, 6.997_62],
        [158.253_207, 6.997_318],
        [158.252_995, 6.997_182],
        [158.252_782, 6.997_092],
        [158.252_516, 6.996_979],
        [158.251_893, 6.996_873],
        [158.251_566, 6.996_926],
        [158.251_323, 6.996_783],
        [158.251_08, 6.996_624],
        [158.250_814, 6.996_451],
        [158.250_844, 6.996_194],
        [158.250_784, 6.995_953],
        [158.250_556, 6.995_727],
        [158.250_153, 6.995_576],
        [158.249_94, 6.995_44],
        [158.249_667, 6.995_252],
        [158.249_461, 6.995_161],
        [158.249_279, 6.995_101],
        [158.248_99, 6.995_139],
        [158.248_873, 6.995_033],
        [158.248_841, 6.9949],
        [158.248_937, 6.994_837],
        [158.249_127, 6.994_799],
        [158.249_241, 6.994_701],
        [158.249_37, 6.994_513],
        [158.249_499, 6.994_301],
        [158.249_553, 6.994_045],
        [158.249_553, 6.993_856],
        [158.249_499, 6.993_585],
        [158.249_401, 6.993_253],
        [158.249_317, 6.992_899],
        [158.249_408, 6.992_657],
        [158.249_401, 6.992_182],
        [158.249_332, 6.992_016],
        [158.249_218, 6.991_76],
        [158.249_211, 6.991_602],
        [158.249_211, 6.991_413],
        [158.249_097, 6.991_134],
        [158.249_22, 6.990_986],
        [158.249_311, 6.990_747],
        [158.249_273, 6.990_478],
        [158.249_188, 6.990_372],
        [158.249_112, 6.990_312],
        [158.248_926, 6.990_338],
        [158.248_848, 6.990_165],
        [158.248_656, 6.990_056],
        [158.248_709, 6.989_905],
        [158.248_709, 6.989_603],
        [158.248_61, 6.989_467],
        [158.248_291, 6.989_286],
        [158.248_223, 6.989_218],
        [158.248_086, 6.989_15],
        [158.247_942, 6.989_015],
        [158.247_79, 6.988_917],
        [158.247_592, 6.988_894],
        [158.247_357, 6.989_203],
        [158.247_22, 6.989_384],
        [158.246_931, 6.989_497],
        [158.246_817, 6.989_633],
        [158.246_764, 6.989_814],
        [158.246_665, 6.989_92],
        [158.246_43, 6.990_063],
        [158.246_095, 6.990_161],
        [158.245_989, 6.990_312],
        [158.245_959, 6.990_598],
        [158.245_845, 6.990_908],
        [158.2457, 6.991_096],
        [158.245_389, 6.991_24],
        [158.245_222, 6.991_353],
        [158.244_956, 6.991_82],
        [158.244_788, 6.991_994],
        [158.244_735, 6.992_212],
        [158.244_72, 6.992_371],
        [158.244_599, 6.992_559],
        [158.244_462, 6.992_755],
      ],
      [
        [158.245_541, 6.990_086],
        [158.245_594, 6.990_236],
        [158.245_67, 6.990_334],
        [158.245_86, 6.990_274],
        [158.245_966, 6.990_138],
        [158.246_027, 6.990_01],
        [158.246_057, 6.989_897],
        [158.245_959, 6.989_799],
        [158.245_754, 6.989_784],
        [158.245_655, 6.989_859],
        [158.245_541, 6.990_086],
      ],
    ],
  },
  "foo",
);

const noOverlapSketch = genSampleSketch<Polygon>({
  type: "Polygon",
  coordinates: [
    [
      [181, 181],
      [181, 182],
      [182, 182],
      [182, 181],
      [181, 181],
    ],
  ],
});

describe("clipToGeography", () => {
  test("clipToGeography - with world polygon should not change the polygon", async () => {
    const curGeography = project.getGeographyById("world");
    const sketchArea = area(sketch);
    const sketchBox = sketch.bbox || bbox(sketch);
    const clippedSketch = await clipToGeography(sketch, curGeography);
    const clippedSketchArea = area(clippedSketch);
    const clippedSketchBox = clippedSketch.bbox || bbox(clippedSketch);
    expect(clippedSketchArea).toEqual(sketchArea);
    expect(sketchBox).toEqual(clippedSketchBox);
  }, 10_000);

  test("clipToGeography - no overlap", async () => {
    const curGeography = project.getGeographyById("world");
    const sketchArea = area(noOverlapSketch);

    const clippedSketch = await clipToGeography(noOverlapSketch, curGeography);
    const clippedSketchArea = area(clippedSketch);
    const clippedSketchBox = clippedSketch.bbox || bbox(clippedSketch);

    // Clipped sketch should be zero-ed
    expect(sketchArea === clippedSketchArea).toBe(false);
    expect(clippedSketchArea).toEqual(0);
    expect(clippedSketchBox.every((v) => v === 0)).toBe(true);
  }, 60_000);

  test("clipToGeography - sketch collection", async () => {
    // Sketch collection with overlapping and non-overlapping polygons
    const curGeography = project.getGeographyById("world");
    const sketchArea = area(sketch);
    const sketchBox = sketch.bbox || bbox(sketch);

    const sketchCollection = genSketchCollection([sketch, noOverlapSketch]);
    const clippedSketchCollection = await clipToGeography(
      sketchCollection,
      curGeography,
    );
    const clippedSketchCollectionArea = area(clippedSketchCollection);
    const clippedSketchCollectionBox =
      clippedSketchCollection.bbox || bbox(clippedSketchCollection);

    expect(sketchArea === clippedSketchCollectionArea).toBe(true);
    for (const [i, bboxCoord] of sketchBox.entries())
      expect(bboxCoord).toBeCloseTo(clippedSketchCollectionBox[i]);
  });
});
