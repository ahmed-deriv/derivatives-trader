import React, { useCallback } from 'react';

import { ActiveSymbols } from '@deriv/api-types';
import { ChartBarrierStore } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { useDevice } from '@deriv-com/ui';

import { SmartChart } from 'Modules/SmartChart';
import { useTraderStore } from 'Stores/useTraderStores';

import AccumulatorsChartElements from '../../SmartChart/Components/Markers/accumulators-chart-elements';
import ToolbarWidgets from '../../SmartChart/Components/toolbar-widgets';

import { ChartBottomWidgets } from './chart-widgets';
import type { TBottomWidgetsParams } from './trade';

type TTradeChartProps = {
    bottomWidgets?: (props: TBottomWidgetsParams) => React.ReactElement;
    has_barrier?: boolean;
    is_accumulator: boolean;
    topWidgets: (() => JSX.Element) | null | undefined;
    children?: React.ReactNode;
};

const TradeChart = observer((props: TTradeChartProps) => {
    const { has_barrier, is_accumulator, topWidgets } = props;
    const { ui, common, contract_trade, portfolio } = useStore();
    const { isMobile } = useDevice();
    const {
        accumulator_barriers_data,
        accumulator_contract_barriers_data,
        chart_type,
        granularity,
        has_crossed_accu_barriers,
        markers_array,
        updateChartType,
        updateGranularity,
    } = contract_trade;
    const ref = React.useRef<{ hasPredictionIndicators(): void; triggerPopup(arg: () => void): void }>(null);
    const { all_positions } = portfolio;
    const { is_chart_countdown_visible, is_chart_layout_default, is_dark_mode_on, is_positions_drawer_on } = ui;
    const { current_language, is_socket_opened } = common;
    const {
        active_symbols,
        barriers_flattened: extra_barriers,
        chartStateChange,
        chart_layout,
        exportLayout,
        has_alternative_source,
        is_trade_enabled,
        main_barrier_flattened: main_barrier,
        setChartStatus,
        show_digits_stats,
        symbol,
        onChange,
        prev_contract_type,
        wsForget,
        wsForgetStream,
        wsSendRequest,
        wsSubscribe,
    } = useTraderStore();

    const settings = {
        countdown: is_chart_countdown_visible,
        isHighestLowestMarkerEnabled: false, // TODO: Pending UI,
        language: current_language.toLowerCase(),
        position: is_chart_layout_default ? 'bottom' : 'left',
        theme: is_dark_mode_on ? 'dark' : 'light',
        ...(is_accumulator ? { whitespace: 190, minimumLeftBars: isMobile ? 3 : undefined } : {}),
        ...(has_barrier ? { whitespace: 110 } : {}),
    };

    const { current_spot, current_spot_time } = accumulator_barriers_data || {};

    const bottomWidgets = React.useCallback(
        ({ digits, tick }: TBottomWidgetsParams) => (
            <ChartBottomWidgets digits={digits} tick={tick} show_accumulators_stats={is_accumulator} />
        ),
        [is_accumulator]
    );

    React.useEffect(() => {
        if ((is_accumulator || show_digits_stats) && ref.current?.hasPredictionIndicators()) {
            const cancelCallback = () => onChange({ target: { name: 'contract_type', value: prev_contract_type } });
            ref.current?.triggerPopup(cancelCallback);
        }
    }, [is_accumulator, onChange, prev_contract_type, show_digits_stats]);

    const getMarketsOrder = (active_symbols: ActiveSymbols): string[] => {
        const synthetic_index = 'synthetic_index';
        const has_synthetic_index = active_symbols.some(s => s.market === synthetic_index);
        return active_symbols
            .slice()
            .sort((a, b) =>
                ((a as any).underlying_symbol || a.symbol) < ((b as any).underlying_symbol || b.symbol) ? -1 : 1
            )
            .map(s => s.market)
            .reduce(
                (arr, market) => {
                    if (arr.indexOf(market) === -1) arr.push(market);
                    return arr;
                },
                has_synthetic_index ? [synthetic_index] : []
            );
    };

    /* Mock Functions */
    const getQuotes = useCallback(async ({ symbol, granularity, count = 100, start, end, style }: any) => {
        const now = Math.floor(Date.now() / 1000);
        const startTime = start || now - count * (granularity || 60);

        const mockCandles = Array.from({ length: count }, (_, i) => {
            const time = startTime + i * (granularity || 60);
            const basePrice = 100 + Math.sin(i * 0.1) * 10 + Math.random() * 5;
            const volatility = 0.5 + Math.random() * 1.5;

            return {
                epoch: time,
                open: basePrice,
                high: basePrice + Math.random() * volatility,
                low: basePrice - Math.random() * volatility,
                close: basePrice + (Math.random() - 0.5) * volatility,
            };
        });

        if (style === 'ticks') {
            return {
                history: {
                    times: mockCandles.map(c => c.epoch),
                    prices: mockCandles.map(c => c.close),
                },
            };
        }

        return { candles: mockCandles };
    }, []);

    const subscribeQuotes = useCallback(({ symbol, granularity }: any, callback: any) => {
        let isActive = true;
        const interval = setInterval(() => {
            if (!isActive) return;
            const tick = {
                epoch: Math.floor(Date.now() / 1000),
                quote: 100 + Math.sin(Date.now() * 0.001) * 10 + Math.random() * 2,
            };
            callback({ tick });
        }, 1000);

        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, []);

    const unsubscribeQuotes = useCallback((request: any) => {
        /* unsubscribe Call */
    }, []);
    /* Mock End here */

    const barriers: ChartBarrierStore[] = main_barrier ? [main_barrier, ...extra_barriers] : extra_barriers;

    // max ticks to display for mobile view for tick chart
    const max_ticks = granularity === 0 ? 8 : 24;

    if (!symbol || !active_symbols.length) return null;

    /* Remove Props 
            // crosshair={isMobile ? 0 : undefined}
            // crosshairTooltipLeftAllow={560}
            // showLastDigitStats={show_digits_stats}
            // initialData={{ activeSymbols: JSON.parse(JSON.stringify(active_symbols)) }}
            // requestAPI={wsSendRequest}
            // requestForget={wsForget}
            // requestForgetStream={wsForgetStream}
            // requestSubscribe={wsSubscribe}
            // hasAlternativeSource={has_alternative_source}
    */

    return (
        <SmartChart
            ref={ref}
            id='trade'
            chartControlsWidgets={null}
            chartStatusListener={(v: boolean) => setChartStatus(!v, true)}
            chartType={chart_type}
            chartData={{
                activeSymbols: JSON.parse(JSON.stringify(active_symbols)),
                tradingTimes: { [symbol]: { isOpen: true, openTime: '', closeTime: '' } },
            }}
            feedCall={{ activeSymbols: false, tradingTimes: false }}
            enabledNavigationWidget={!isMobile}
            enabledChartFooter={false}
            isMobile={isMobile}
            maxTick={isMobile ? max_ticks : undefined}
            granularity={show_digits_stats || is_accumulator ? 0 : granularity}
            getQuotes={getQuotes}
            subscribeQuotes={subscribeQuotes}
            unsubscribeQuotes={unsubscribeQuotes}
            getMarketsOrder={getMarketsOrder}
            settings={settings}
            allowTickChartTypeOnly={show_digits_stats || is_accumulator}
            stateChangeListener={chartStateChange}
            symbol={symbol}
            topWidgets={is_trade_enabled ? topWidgets : null}
            isConnectionOpened={is_socket_opened}
            clearChart={false}
            bottomWidgets={(is_accumulator || show_digits_stats) && !isMobile ? bottomWidgets : props.bottomWidgets}
            toolbarWidget={() => {
                return <ToolbarWidgets updateChartType={updateChartType} updateGranularity={updateGranularity} />;
            }}
            importedLayout={chart_layout}
            onExportLayout={exportLayout}
            shouldFetchTradingTimes={false}
            yAxisMargin={{ top: isMobile ? 76 : 106 }}
            isLive
            should_zoom_out_on_yaxis={is_accumulator}
            leftMargin={!isMobile && is_positions_drawer_on ? 328 : 80}
            barriers={barriers}
            contracts_array={markers_array}
            hasAlternativeSource={has_alternative_source}
        >
            {is_accumulator && (
                <AccumulatorsChartElements
                    all_positions={all_positions}
                    current_spot={current_spot}
                    current_spot_time={current_spot_time}
                    has_crossed_accu_barriers={has_crossed_accu_barriers}
                    should_show_profit_text={!!accumulator_contract_barriers_data.accumulators_high_barrier}
                    symbol={symbol}
                    is_mobile={isMobile}
                />
            )}
        </SmartChart>
        // <>Chart here</>
    );
});
export default TradeChart;
