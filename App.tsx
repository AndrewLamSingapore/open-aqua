import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button, Card, SectionTitle } from './src/components';
import { evaluateTank, previewWaterChange } from './src/domain/decisionEngine';
import { Activity, Reading, Tank, WaterParameter } from './src/domain/types';
import { loadTank, saveTank } from './src/storage/tankStore';
import { colors } from './src/theme';

type Tab = 'now' | 'memory' | 'plan' | 'library';
const labels: Record<Tab, string> = { now: 'Aqua Now', memory: 'Memory', plan: 'Quiet Plan', library: 'Library' };
const parameterUnits: Record<WaterParameter, Reading['unit']> = { temperature: '°C', ph: 'pH', ammonia: 'mg/L', nitrite: 'mg/L', nitrate: 'mg/L' };

export default function App() {
  const [tank, setTank] = useState<Tank | null>(null);
  const [tab, setTab] = useState<Tab>('now');
  const [quick, setQuick] = useState(false);
  const [saved, setSaved] = useState('Saved on this phone');

  useEffect(() => { loadTank().then(setTank); }, []);
  const updateTank = async (next: Tank) => { setTank(next); setSaved('Saving…'); await saveTank(next); setSaved('Saved on this phone'); };
  if (!tank) return <SafeAreaView style={styles.loading}><Text>Preparing your tank…</Text></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View style={styles.header}>
      <View><Text style={styles.brand}>OPEN AQUA</Text><Text style={styles.tankName}>{tank.name}</Text></View>
      <Text style={styles.saved}>{saved}</Text>
    </View>
    <ScrollView style={styles.body} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {tab === 'now' && <AquaNow tank={tank} onPreview={() => setTab('plan')} />}
      {tab === 'memory' && <TankMemory tank={tank} />}
      {tab === 'plan' && <TryChange tank={tank} />}
      {tab === 'library' && <Library />}
    </ScrollView>
    <View style={styles.nav}>
      {(Object.keys(labels) as Tab[]).map((key) => <Pressable key={key} style={styles.navItem} onPress={() => setTab(key)} accessibilityRole="tab">
        <Text style={[styles.navText, tab === key && styles.navActive]}>{labels[key]}</Text>
      </Pressable>)}
      <Pressable accessibilityLabel="Quick Update" style={styles.plus} onPress={() => setQuick(true)}><Text style={styles.plusText}>＋</Text></Pressable>
    </View>
    {quick && <QuickUpdate tank={tank} onClose={() => setQuick(false)} onSave={updateTank} />}
  </SafeAreaView>;
}

function AquaNow({ tank, onPreview }: { tank: Tank; onPreview: () => void }) {
  const rec = useMemo(() => evaluateTank(tank), [tank]);
  const tone = rec.state === 'all_clear' ? colors.teal : rec.state === 'needs_attention' ? colors.coral : colors.amber;
  return <>
    <Text style={styles.eyebrow}>RIGHT NOW</Text>
    <Text style={styles.hero}>Your tank, without the noise.</Text>
    <Card>
      <View style={[styles.statePill, { backgroundColor: tone }]}><Text style={styles.stateText}>{rec.state.replaceAll('_', ' ').toUpperCase()}</Text></View>
      <Text style={styles.cardTitle}>{rec.title}</Text><Text style={styles.action}>{rec.action}</Text><Text style={styles.reason}>{rec.reason}</Text>
      <View style={styles.metaRow}><Text style={styles.meta}>{rec.estimatedMinutes} min</Text><Text style={styles.meta}>{rec.confidence} support</Text></View>
      {rec.state !== 'all_clear' && <Button label="Try a change" onPress={onPreview} />}
    </Card>
    <SectionTitle>Why Open Aqua says this</SectionTitle>
    <Card>{rec.evidence.map((item) => <Text key={item} style={styles.list}>• {item}</Text>)}</Card>
    <Text style={styles.calm}>No streaks. No attention traps. If nothing needs doing, Open Aqua will say so.</Text>
  </>;
}

function TankMemory({ tank }: { tank: Tank }) {
  const rows = [...tank.readings].sort((a,b) => Date.parse(b.observedAt)-Date.parse(a.observedAt));
  return <><Text style={styles.eyebrow}>TANK MEMORY</Text><Text style={styles.hero}>What your aquarium has told us.</Text>
    <Card><Text style={styles.cardTitle}>{tank.volumeLitres} L · {tank.profile.replaceAll('_',' ')}</Text><Text style={styles.reason}>{tank.readings.length} water records · {tank.activities.length} care records</Text></Card>
    <SectionTitle>Latest water tests</SectionTitle>
    {rows.map((r) => <Card key={r.id}><View style={styles.row}><Text style={styles.measure}>{r.parameter}</Text><Text style={styles.value}>{r.value} {r.unit}</Text></View><Text style={styles.reason}>{r.method} · {new Date(r.observedAt).toLocaleString()}</Text></Card>)}
    <SectionTitle>Recent care</SectionTitle>{tank.activities.map((a) => <Card key={a.id}><Text style={styles.measure}>{a.type.replaceAll('_',' ')}</Text><Text style={styles.reason}>{a.note ?? 'No note'} · {new Date(a.occurredAt).toLocaleDateString()}</Text></Card>)}
  </>;
}

function TryChange({ tank }: { tank: Tank }) {
  const [percent, setPercent] = useState(25);
  const preview = previewWaterChange(tank, percent);
  return <><Text style={styles.eyebrow}>TRY A CHANGE</Text><Text style={styles.hero}>See the arithmetic before touching the tank.</Text>
    <Card><Text style={styles.cardTitle}>Water-change preview</Text><View style={styles.choiceRow}>{[10,20,25,30].map(p => <Pressable key={p} onPress={() => setPercent(p)} style={[styles.choice, p===percent && styles.choiceActive]}><Text style={p===percent ? styles.choiceActiveText : styles.choiceText}>{p}%</Text></Pressable>)}</View>
    {preview ? <><Text style={styles.preview}>{preview.currentNitrate} → {preview.estimatedNitrate} mg/L</Text><Text style={styles.reason}>Using source water at {preview.sourceNitrate} mg/L nitrate.</Text><Text style={styles.warning}>{preview.limitation}</Text></> : <Text style={styles.warning}>Add a current nitrate and source-water value to preview this change.</Text>}</Card>
    <Card><Text style={styles.measure}>No-action baseline</Text><Text style={styles.reason}>The tank record stays unchanged. A preview is never written as a real reading.</Text></Card>
  </>;
}

function Library() {
  return <><Text style={styles.eyebrow}>SINGAPORE FRESHWATER LIBRARY</Text><Text style={styles.hero}>Local names. Reviewed facts. Clear limits.</Text>
  {['Harlequin rasbora · Trigonostigma heteromorpha','Java fern · Microsorum pteropus','Cherry shrimp · Neocaridina davidi'].map((name, index) => <Card key={name}><Text style={styles.cardTitle}>{name}</Text><Text style={styles.reason}>{index===0?'Peaceful schooling fish commonly kept in planted community tanks.':index===1?'Low-tech epiphyte plant; attach to wood or rock rather than burying the rhizome.':'Reviewed coverage is limited; species-specific advice appears only with verified context.'}</Text><Text style={styles.source}>Singapore pack · reviewed record</Text></Card>)}</>;
}

function QuickUpdate({ tank, onClose, onSave }: { tank: Tank; onClose: () => void; onSave: (tank: Tank) => Promise<void> }) {
  const [mode, setMode] = useState<'water'|'activity'>('water');
  const [parameter, setParameter] = useState<WaterParameter>('nitrate');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const submit = async () => {
    if (mode === 'water') {
      const number = Number(value); if (!Number.isFinite(number) || value.trim()==='') return;
      const reading: Reading = { id: `reading-${Date.now()}`, parameter, value: number, unit: parameterUnits[parameter], observedAt: new Date().toISOString(), method: 'manual entry' };
      await onSave({ ...tank, readings: [reading, ...tank.readings] });
    } else {
      const activity: Activity = { id: `activity-${Date.now()}`, type: 'observation', occurredAt: new Date().toISOString(), note: note || 'Owner observation' };
      await onSave({ ...tank, activities: [activity, ...tank.activities] });
    }
    onClose();
  };
  return <View style={styles.overlay}><View style={styles.sheet}><View style={styles.sheetHead}><Text style={styles.cardTitle}>Quick Update</Text><Pressable onPress={onClose}><Text style={styles.close}>×</Text></Pressable></View>
    <View style={styles.choiceRow}><Pressable onPress={() => setMode('water')} style={[styles.choice,mode==='water'&&styles.choiceActive]}><Text style={mode==='water'?styles.choiceActiveText:styles.choiceText}>Water test</Text></Pressable><Pressable onPress={() => setMode('activity')} style={[styles.choice,mode==='activity'&&styles.choiceActive]}><Text style={mode==='activity'?styles.choiceActiveText:styles.choiceText}>Observation</Text></Pressable></View>
    {mode==='water' ? <><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paramRow}>{(['temperature','ph','ammonia','nitrite','nitrate'] as WaterParameter[]).map(p => <Pressable key={p} onPress={() => setParameter(p)} style={[styles.param,parameter===p&&styles.paramActive]}><Text style={parameter===p?styles.paramActiveText:styles.choiceText}>{p}</Text></Pressable>)}</ScrollView><TextInput accessibilityLabel="Water test value" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={`Value in ${parameterUnits[parameter]}`} style={styles.input}/></> : <TextInput accessibilityLabel="Observation note" value={note} onChangeText={setNote} placeholder="What did you notice?" multiline style={[styles.input,{height:96}]} />}
    <Button label="Save update" onPress={submit}/><Button label="Cancel" onPress={onClose} secondary/>
  </View></View>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.cloud},loading:{flex:1,alignItems:'center',justifyContent:'center'},header:{paddingHorizontal:20,paddingVertical:14,backgroundColor:colors.white,borderBottomWidth:1,borderColor:colors.line,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{fontSize:12,fontWeight:'900',letterSpacing:2,color:colors.teal},tankName:{fontSize:18,fontWeight:'800',color:colors.navy,marginTop:2},saved:{fontSize:11,color:colors.muted,maxWidth:100,textAlign:'right'},body:{flex:1},content:{padding:20,paddingBottom:120},eyebrow:{fontSize:12,fontWeight:'900',letterSpacing:1.6,color:colors.teal,marginTop:8},hero:{fontSize:32,lineHeight:38,fontWeight:'900',color:colors.navy,marginVertical:10,marginBottom:20},statePill:{alignSelf:'flex-start',borderRadius:99,paddingVertical:7,paddingHorizontal:11,marginBottom:14},stateText:{color:colors.white,fontWeight:'900',fontSize:11,letterSpacing:1},cardTitle:{fontSize:20,fontWeight:'900',color:colors.navy},action:{fontSize:18,fontWeight:'800',color:colors.teal,marginTop:10},reason:{fontSize:15,lineHeight:22,color:colors.muted,marginTop:7},metaRow:{flexDirection:'row',gap:9,marginTop:14},meta:{backgroundColor:colors.aqua,color:colors.teal,paddingVertical:6,paddingHorizontal:9,borderRadius:8,fontWeight:'700',fontSize:12},list:{fontSize:15,color:colors.ink,lineHeight:26},calm:{color:colors.muted,textAlign:'center',fontSize:13,lineHeight:19,marginVertical:8},nav:{height:78,backgroundColor:colors.white,borderTopWidth:1,borderColor:colors.line,flexDirection:'row',alignItems:'center',paddingHorizontal:8},navItem:{flex:1,alignItems:'center',justifyContent:'center',minHeight:48},navText:{fontSize:11,fontWeight:'700',color:colors.muted},navActive:{color:colors.teal},plus:{position:'absolute',width:58,height:58,borderRadius:29,backgroundColor:colors.teal,alignItems:'center',justifyContent:'center',left:'50%',marginLeft:-29,bottom:48,borderWidth:4,borderColor:colors.cloud},plusText:{fontSize:30,color:colors.white,lineHeight:34},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},measure:{fontSize:16,fontWeight:'800',color:colors.ink,textTransform:'capitalize'},value:{fontSize:20,fontWeight:'900',color:colors.teal},choiceRow:{flexDirection:'row',gap:8,flexWrap:'wrap',marginVertical:14},choice:{paddingHorizontal:15,minHeight:44,borderRadius:14,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},choiceActive:{backgroundColor:colors.teal,borderColor:colors.teal},choiceText:{color:colors.ink,fontWeight:'700'},choiceActiveText:{color:colors.white,fontWeight:'800'},preview:{fontSize:34,fontWeight:'900',color:colors.navy,marginTop:14},warning:{fontSize:13,lineHeight:19,color:colors.coral,marginTop:14},source:{fontSize:12,color:colors.teal,fontWeight:'800',marginTop:12},overlay:{...StyleSheet.absoluteFill,backgroundColor:'rgba(8,31,45,0.45)',justifyContent:'flex-end'},sheet:{backgroundColor:colors.white,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,paddingBottom:30},sheetHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},close:{fontSize:34,color:colors.muted},paramRow:{maxHeight:52,marginVertical:8},param:{paddingHorizontal:13,height:42,borderRadius:12,justifyContent:'center',marginRight:7,backgroundColor:colors.cloud},paramActive:{backgroundColor:colors.navy},paramActiveText:{color:colors.white,fontWeight:'800'},input:{borderWidth:1,borderColor:colors.line,borderRadius:14,minHeight:54,padding:14,fontSize:17,color:colors.ink,marginTop:12}
});
