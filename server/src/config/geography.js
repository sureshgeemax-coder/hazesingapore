const line = (id, name, shortName, color, stations) => ({
  id, name, shortName, color,
  stations: stations.map(([code, stationName]) => ({ code, name: stationName }))
});

export const mrtLines = [
  line('purple', 'Purple Line - North East Line', 'North East Line (NEL)', '#9900aa', [
    ['NE1','HarbourFront'],['NE3','Outram Park'],['NE4','Chinatown'],['NE5','Clarke Quay'],['NE6','Dhoby Ghaut'],['NE7','Little India'],['NE8','Farrer Park'],['NE9','Boon Keng'],['NE10','Potong Pasir'],['NE11','Woodleigh'],['NE12','Serangoon'],['NE13','Kovan'],['NE14','Hougang'],['NE15','Buangkok'],['NE16','Sengkang'],['NE17','Punggol'],['NE18','Punggol Coast']
  ]),
  line('brown', 'Brown Line - Thomson-East Coast Line', 'Thomson-East Coast Line (TEL)', '#9d5b25', [
    ['TE1','Woodlands North'],['TE2','Woodlands'],['TE3','Woodlands South'],['TE4','Springleaf'],['TE5','Lentor'],['TE6','Mayflower'],['TE7','Bright Hill'],['TE8','Upper Thomson'],['TE9','Caldecott'],['TE11','Stevens'],['TE12','Napier'],['TE13','Orchard Boulevard'],['TE14','Orchard'],['TE15','Great World'],['TE16','Havelock'],['TE17','Outram Park'],['TE18','Maxwell'],['TE19','Shenton Way'],['TE20','Marina Bay'],['TE22','Gardens by the Bay'],['TE23','Tanjong Rhu'],['TE24','Katong Park'],['TE25','Tanjong Katong'],['TE26','Marine Parade'],['TE27','Marine Terrace'],['TE28','Siglap'],['TE29','Bayshore']
  ]),
  line('green', 'Green Line - East-West Line', 'East-West Line (EWL)', '#009645', [
    ['EW1','Pasir Ris'],['EW2','Tampines'],['EW3','Simei'],['EW4','Tanah Merah'],['EW5','Bedok'],['EW6','Kembangan'],['EW7','Eunos'],['EW8','Paya Lebar'],['EW9','Aljunied'],['EW10','Kallang'],['EW11','Lavender'],['EW12','Bugis'],['EW13','City Hall'],['EW14','Raffles Place'],['EW15','Tanjong Pagar'],['EW16','Outram Park'],['EW17','Tiong Bahru'],['EW18','Redhill'],['EW19','Queenstown'],['EW20','Commonwealth'],['EW21','Buona Vista'],['EW22','Dover'],['EW23','Clementi'],['EW24','Jurong East'],['EW25','Chinese Garden'],['EW26','Lakeside'],['EW27','Boon Lay'],['EW28','Pioneer'],['EW29','Joo Koon'],['EW30','Gul Circle'],['EW31','Tuas Crescent'],['EW32','Tuas West Road'],['EW33','Tuas Link'],['CG1','Expo'],['CG2','Changi Airport']
  ]),
  line('red', 'Red Line - North-South Line', 'North-South Line (NSL)', '#d42e12', [
    ['NS1','Jurong East'],['NS2','Bukit Batok'],['NS3','Bukit Gombak'],['NS4','Choa Chu Kang'],['NS5','Yew Tee'],['NS7','Kranji'],['NS8','Marsiling'],['NS9','Woodlands'],['NS10','Admiralty'],['NS11','Sembawang'],['NS12','Canberra'],['NS13','Yishun'],['NS14','Khatib'],['NS15','Yio Chu Kang'],['NS16','Ang Mo Kio'],['NS17','Bishan'],['NS18','Braddell'],['NS19','Toa Payoh'],['NS20','Novena'],['NS21','Newton'],['NS22','Orchard'],['NS23','Somerset'],['NS24','Dhoby Ghaut'],['NS25','City Hall'],['NS26','Raffles Place'],['NS27','Marina Bay'],['NS28','Marina South Pier']
  ]),
  line('blue', 'Blue Line - Downtown Line', 'Downtown Line (DTL)', '#005ec4', [
    ['DT1','Bukit Panjang'],['DT2','Cashew'],['DT3','Hillview'],['DT4','Hume'],['DT5','Beauty World'],['DT6','King Albert Park'],['DT7','Sixth Avenue'],['DT8','Tan Kah Kee'],['DT9','Botanic Gardens'],['DT10','Stevens'],['DT11','Newton'],['DT12','Little India'],['DT13','Rochor'],['DT14','Bugis'],['DT15','Promenade'],['DT16','Bayfront'],['DT17','Downtown'],['DT18','Telok Ayer'],['DT19','Chinatown'],['DT20','Fort Canning'],['DT21','Bencoolen'],['DT22','Jalan Besar'],['DT23','Bendemeer'],['DT24','Geylang Bahru'],['DT25','Mattar'],['DT26','MacPherson'],['DT27','Ubi'],['DT28','Kaki Bukit'],['DT29','Bedok North'],['DT30','Bedok Reservoir'],['DT31','Tampines West'],['DT32','Tampines'],['DT33','Tampines East'],['DT34','Upper Changi'],['DT35','Expo']
  ]),
  line('orange', 'Orange Line - Circle Line', 'Circle Line (CCL)', '#fa9e0d', [
    ['CC1','Dhoby Ghaut'],['CC2','Bras Basah'],['CC3','Esplanade'],['CC4','Promenade'],['CC5','Nicoll Highway'],['CC6','Stadium'],['CC7','Mountbatten'],['CC8','Dakota'],['CC9','Paya Lebar'],['CC10','MacPherson'],['CC11','Tai Seng'],['CC12','Bartley'],['CC13','Serangoon'],['CC14','Lorong Chuan'],['CC15','Bishan'],['CC16','Marymount'],['CC17','Caldecott'],['CC19','Botanic Gardens'],['CC20','Farrer Road'],['CC21','Holland Village'],['CC22','Buona Vista'],['CC23','one-north'],['CC24','Kent Ridge'],['CC25','Haw Par Villa'],['CC26','Pasir Panjang'],['CC27','Labrador Park'],['CC28','Telok Blangah'],['CC29','HarbourFront'],['CC30','Keppel'],['CC31','Cantonment'],['CC32','Prince Edward Road'],['CC33','Marina Bay'],['CC34','Bayfront']
  ])
];

const place = (name, direction, searchName = name) => ({ id: slug(name), name, direction, searchName, type: 'place' });

export const places = [
  place('Pasir Ris','east'),place('Tampines','east'),place('Simei','east'),place('Bedok','east'),place('Tanah Merah','east'),place('Changi','east'),place('Paya Lebar','east'),place('Katong','east'),place('Marine Parade','east'),place('Bedok Reservoir','east'),place('East Coast Park','east'),place('Eunos','east'),place('Kembangan','east'),place('Geylang','east'),place('Changi Village','east'),
  place('Jurong East','west'),place('Jurong West','west'),place('Clementi','west'),place('Boon Lay','west'),place('Bukit Batok','west'),place('Bukit Panjang','west'),place('Tuas','west'),place('Choa Chu Kang','west'),place('Queenstown','west'),place('Commonwealth','west'),place('Buona Vista','west'),place('Dover','west'),place('West Coast','west'),place('Holland Village','west'),place('Kent Ridge','west'),
  place('Woodlands','north'),place('Yishun','north'),place('Sembawang','north'),place('Admiralty','north'),place('Kranji','north'),place('Canberra','north'),place('Ang Mo Kio','north'),place('Bishan','north'),place('Sengkang','north'),place('Punggol','north'),place('Hougang','north'),place('Serangoon','north'),place('Khatib','north'),place('Lentor','north'),place('Upper Thomson','north'),
  place('HarbourFront','south'),place('Telok Blangah','south'),place('Bukit Merah','south'),place('Tiong Bahru','south'),place('Alexandra','south'),place('Marina South','south'),place('Marina Bay','south'),place('Orchard','south'),place('Outram','south'),place('Chinatown','south'),place('Tanjong Pagar','south'),place('Raffles Place','south'),place('Sentosa','south'),place('River Valley','south'),place('Clarke Quay','south')
];

const north = new Set(['Woodlands North','Woodlands','Woodlands South','Springleaf','Lentor','Mayflower','Bright Hill','Upper Thomson','Kranji','Marsiling','Admiralty','Sembawang','Canberra','Yishun','Khatib','Yio Chu Kang','Ang Mo Kio','Bishan','Braddell','Serangoon','Kovan','Hougang','Buangkok','Sengkang','Punggol','Punggol Coast','Woodleigh','Lorong Chuan','Marymount','Caldecott']);
const west = new Set(['Jurong East','Bukit Batok','Bukit Gombak','Choa Chu Kang','Yew Tee','Bukit Panjang','Cashew','Hillview','Hume','Beauty World','King Albert Park','Sixth Avenue','Tan Kah Kee','Botanic Gardens','Farrer Road','Holland Village','Buona Vista','one-north','Kent Ridge','Haw Par Villa','Pasir Panjang','Queenstown','Commonwealth','Dover','Clementi','Chinese Garden','Lakeside','Boon Lay','Pioneer','Joo Koon','Gul Circle','Tuas Crescent','Tuas West Road','Tuas Link']);
const east = new Set(['Pasir Ris','Tampines','Simei','Tanah Merah','Bedok','Kembangan','Eunos','Paya Lebar','Aljunied','Geylang Bahru','Mattar','MacPherson','Ubi','Kaki Bukit','Bedok North','Bedok Reservoir','Tampines West','Tampines East','Upper Changi','Expo','Changi Airport','Tai Seng','Bartley','Mountbatten','Dakota','Stadium','Tanjong Rhu','Katong Park','Tanjong Katong','Marine Parade','Marine Terrace','Siglap','Bayshore']);

function directionFor(name) { return north.has(name) ? 'north' : west.has(name) ? 'west' : east.has(name) ? 'east' : 'south'; }
export function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

const stationMap = new Map();
for (const mrtLine of mrtLines) {
  for (const entry of mrtLine.stations) {
    const id = slug(entry.name);
    const station = stationMap.get(id) || { id, name: entry.name, codes: [], lines: [], direction: directionFor(entry.name), places: [entry.name], type: 'station', searchName: `${entry.name} MRT Station` };
    station.codes.push(entry.code);
    station.lines.push({ id: mrtLine.id, name: mrtLine.shortName, color: mrtLine.color });
    stationMap.set(id, station);
  }
}

export const mrtStations = [...stationMap.values()];
export const directionRules = 'Four product regions are used: north covers the northern residential corridor and north-east towns; east covers the eastern corridor through Changi; west covers Jurong, Bukit Panjang and the western corridor; central, downtown and southern waterfront locations are grouped as south. These are application groupings, not official planning boundaries.';
