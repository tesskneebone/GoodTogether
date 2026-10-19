import pandas as pd, matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
d=pd.read_csv('data/c.csv'); d['dt']=pd.to_datetime(d['Date received'])
d=d[d.dt<'2026-10-01']; d['m']=d.dt.dt.to_period('M').dt.to_timestamp()+pd.Timedelta(days=14)
t=d.groupby(['m','Company']).size().unstack(fill_value=0)
base=t[t.index<'2026-01-01'].mean()
idx=t/base*100
pnc=idx['PNC Bank N.A.']; peers=idx.drop(columns='PNC Bank N.A.')
p=d[d.Company=='PNC Bank N.A.']; ca=p[p.State.isin(['CO','AZ'])].groupby('m').size().reindex(t.index,fill_value=0)
INK='#1f1f1f'; MUTED='#6b6b6b'; GRID='#e6e6e6'; BLUE='#2a78d6'; GRAY='#9a9a9a'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.edgecolor':GRID,'axes.labelcolor':MUTED,'xtick.color':MUTED,'ytick.color':MUTED})
fig,(a,b)=plt.subplots(2,1,figsize=(9,7.2),gridspec_kw={'height_ratios':[1.5,1]},sharex=True)
for c in peers: a.plot(peers.index,peers[c],color=GRAY,lw=1,alpha=.45)
a.plot(peers.index,peers.mean(axis=1),color=GRAY,lw=2,ls='--',label='Peer average (5 regional banks)')
a.plot(pnc.index,pnc,color=BLUE,lw=2.4,marker='o',ms=4,label='PNC')
a.axhline(100,color=GRID,lw=1)
ev=[('2026-01-05','FirstBank deal\ncloses (Jan 5) ','right'),('2026-06-22','FirstBank\nconversion (Jun 22) ','right'),('2026-07-07',' New app\n launch (Jul 7)','left')]
for x,l,h in ev:
  for ax in (a,b): ax.axvline(pd.Timestamp(x),color=MUTED,lw=.8,ls=':')
  a.text(pd.Timestamp(x),262,l,fontsize=8,color=MUTED,ha=h,va='top')
a.set_ylim(40,265); a.set_ylabel('Index (2025 monthly avg = 100)')
a.set_title('Checking & savings complaints to the CFPB, indexed to each bank\'s 2025 average',loc='left',color=INK,fontsize=11.5,fontweight='bold')
a.legend(loc='upper left',frameon=False,fontsize=9,bbox_to_anchor=(0,0.80))
a.annotate(f'PNC {pnc.iloc[-3]:.0f}',(pnc.index[-3],pnc.iloc[-3]),xytext=(-58,4),textcoords='offset points',fontsize=9,color=INK)
b.bar(ca.index,ca.values,width=22,color=BLUE)
for x,v in ca.items():
  if v>=11: b.text(x,v+.6,str(v),ha='center',fontsize=8,color=INK)
b.set_ylabel('Complaints / month'); b.set_ylim(0,30)
b.set_title('PNC complaints from Colorado & Arizona (FirstBank footprint)',loc='left',color=INK,fontsize=11,fontweight='bold')
for ax in (a,b):
  ax.grid(axis='y',color=GRID,lw=.8); ax.set_axisbelow(True)
  for s in ('top','right'): ax.spines[s].set_visible(False)
import matplotlib.dates as md
b.xaxis.set_major_formatter(md.DateFormatter('%b\n%y')); b.xaxis.set_major_locator(md.MonthLocator(bymonth=[1,4,7,10])); b.set_xlim(pd.Timestamp('2024-12-28'),pd.Timestamp('2026-10-04'))
fig.text(0.01,0.005,'Source: CFPB Consumer Complaint Database, product = Checking or savings account, received Jan 2025–Sep 2026. Peers: Truist, Citizens, Fifth Third, Huntington, KeyCorp.\nComplaints are published after company response or 15 days, so Sep 2026 may be slightly undercounted. Complaint volume is not a measure of total customers affected.',fontsize=7,color=MUTED)
plt.tight_layout(rect=(0,0.04,1,1)); plt.savefig('cfpb_pnc_complaints.png',dpi=200)
