// Before JSON.parse: wrap any number > 15 digits after "Value": as a string
function safeParse(jsonText) {
  const safe = jsonText.replace(/("Value"\s*:\s*)(\d{16,})/g, '$1"$2"');
  return JSON.parse(safe);
}

// Before saving: convert string IDs back to bare numbers
function safeSerialize(data) {
  let json = JSON.stringify(data, null, 2);
  json = json.replace(/("Value"\s*:\s*)"(\d+)"/g, '$1$2');
  return json;
}

window.Schema = {
  // Fixed-point conversion (game uses Q16.16 fixed-point)
  FP_SCALE: 65536,
  fpToReal(rawValue) { return rawValue / 65536; },
  realToFp(realValue) { return Math.round(realValue * 65536); },
  
  // EventTriggerType enum
  TRIGGER_TYPES: {
    0: { name: 'TimeTrigger', label: '⏱ Time', dataKey: 'TimeTrigger' },
    1: { name: 'StatueHealthTrigger', label: '🏛 Statue Health', dataKey: 'StatueHealthTrigger' },
    2: { name: 'ResourceTrigger', label: '💰 Resource', dataKey: 'ResourceTrigger' },
    3: { name: 'EntityStateTrigger', label: '👤 Entity State', dataKey: 'EntityStateTrigger' },
    4: { name: 'RegisterTrigger', label: '📝 Register', dataKey: 'RegisterTrigger' },
    5: { name: 'UnitBuiltTrigger', label: '🔨 Unit Built', dataKey: 'UnitBuiltTrigger' },
    6: { name: 'ArmyBuiltTrigger', label: '⚔ Army Built', dataKey: 'ArmyBuiltTrigger' },
    7: { name: 'UnitBuildingTrigger', label: '🔧 Unit Building', dataKey: 'UnitBuildingTrigger' },
    8: { name: 'TeamStanceTrigger', label: '🛡 Team Stance', dataKey: 'TeamStanceTrigger' },
    9: { name: 'StateMachineTrigger', label: '⚙ State Machine', dataKey: 'StateMachineTrigger' },
    10: { name: 'SpellCastTrigger', label: '✨ Spell Cast', dataKey: 'SpellCastTrigger' },
    11: { name: 'CameraTrigger', label: '📷 Camera', dataKey: 'CameraTrigger' },
    12: { name: 'GeneralWasPickedTrigger', label: '👑 General Picked', dataKey: 'GeneralWasPickedTrigger' },
    13: { name: 'DifficultyTrigger', label: '🎯 Difficulty', dataKey: 'DifficultyTrigger' },
    14: { name: 'TeamDesperationTrigger', label: '💀 Desperation', dataKey: 'TeamDesperationTrigger' },
    15: { name: 'UpgradeBuildingTrigger', label: '🏗 Upgrade Building', dataKey: 'UpgradeBuildingTrigger' },
  },
  
  // ActionType enum  
  ACTION_TYPES: {
    0: { name: 'SpawnUnits', label: '⚔ Spawn Units', color: '#4CAF50', dataKey: 'SpawnUnits' },
    1: { name: 'SpawnGeneral', label: '👑 Spawn General', color: '#FF9800', dataKey: 'SpawnGeneral' },
    2: { name: 'CameraPan', label: '📷 Camera Pan', color: '#2196F3', dataKey: 'CameraPan' },
    3: { name: 'GiveSpeech', label: '💬 Speech', color: '#9C27B0', dataKey: 'GiveSpeech' },
    4: { name: 'UnitGestureAction', label: '🎭 Gesture', color: '#607D8B', dataKey: 'UnitGestureAction' },
    5: { name: 'ModifyUI', label: '🖥 Modify UI', color: '#795548', dataKey: 'ModifyUI' },
    6: { name: 'UnitAiCommand', label: '🤖 AI Command', color: '#00BCD4', dataKey: 'UnitAiCommand' },
    7: { name: 'FullScreenMessage', label: '📢 Full Screen Msg', color: '#E91E63', dataKey: 'FullScreenMessage' },
    8: { name: 'MessagePopup', label: '💭 Popup', color: '#E91E63', dataKey: 'MessagePopup' },
    9: { name: 'SetRegister', label: '📝 Set Register', color: '#607D8B', dataKey: 'SetRegister' },
    10: { name: 'TellUserToPerformAction', label: '📋 Tutorial Step', color: '#FF5722', dataKey: 'TellUserToPerformAction' },
    11: { name: 'LabelUnitBuiltFromQueue', label: '🏷 Label Unit', color: '#607D8B', dataKey: 'LabelUnitBuiltFromQueue' },
    12: { name: 'SpawnEntityPrototype', label: '🎯 Spawn Entity', color: '#4CAF50', dataKey: 'SpawnEntityPrototype' },
    13: { name: 'GameObjectiveMessage', label: '🎯 Objective', color: '#FFC107', dataKey: 'GameObjectiveMessage' },
    14: { name: 'SetFogOfWar', label: '🌫 Fog of War', color: '#9E9E9E', dataKey: 'SetFogOfWar' },
    15: { name: 'SetCapturePoint', label: '🚩 Capture Point', color: '#FF9800', dataKey: 'SetCapturePoint' },
    16: { name: 'SideWin', label: '🏆 Side Win', color: '#FFD700', dataKey: 'SideWin' },
    17: { name: 'CutSceneMode', label: '🎬 Cutscene', color: '#9C27B0', dataKey: 'CutSceneMode' },
    18: { name: 'ToggleNotificationPopups', label: '🔔 Toggle Notifications', color: '#607D8B', dataKey: 'ToggleNotificationPopups' },
    19: { name: 'TogglePause', label: '⏸ Toggle Pause', color: '#F44336', dataKey: 'TogglePause' },
    20: { name: 'TeamAiCommand', label: '🤖 Team AI', color: '#00BCD4', dataKey: 'TeamAiCommand' },
    21: { name: 'GiveResearch', label: '🔬 Give Research', color: '#8BC34A', dataKey: 'GiveResearch' },
    22: { name: 'StateMachine', label: '⚙ State Machine', color: '#607D8B', dataKey: 'StateMachine' },
    23: { name: 'KeepUnitSelected', label: '👆 Keep Selected', color: '#607D8B', dataKey: 'KeepUnitSelected' },
    24: { name: 'KeepUnitAlive', label: '❤ Keep Alive', color: '#F44336', dataKey: 'KeepUnitAlive' },
    25: { name: 'SetUserCommandsAvailable', label: '🎮 User Commands', color: '#607D8B', dataKey: 'SetUserCommandsAvailable' },
    26: { name: 'SetTutorialMineAndBuildTimes', label: '⏱ Tutorial Times', color: '#607D8B', dataKey: 'SetTutorialMineAndBuildTimes' },
    27: { name: 'ClearStage', label: '🗑 Clear Stage', color: '#F44336', dataKey: 'ClearStage' },
    28: { name: 'RemoveEntityAction', label: '❌ Remove Entity', color: '#F44336', dataKey: 'RemoveEntityAction' },
    29: { name: 'PlayFmodEvent', label: '🔊 Play Sound', color: '#795548', dataKey: 'PlayFmodEvent' },
    30: { name: 'PlayVideoAsOverlay', label: '🎥 Play Video', color: '#9C27B0', dataKey: 'PlayVideoAsOverlay' },
    31: { name: 'ToggleMusic', label: '🎵 Toggle Music', color: '#795548', dataKey: 'ToggleMusic' },
    32: { name: 'RangedAttackOverrideAction', label: '🏹 Ranged Override', color: '#607D8B', dataKey: 'RangedAttackOverrideAction' },
    33: { name: 'LoadSceneAdditive', label: '🌍 Load Scene', color: '#607D8B', dataKey: 'LoadSceneAdditive' },
    34: { name: 'ReplaceBackdrop', label: '🖼 Replace Backdrop', color: '#795548', dataKey: 'ReplaceBackdrop' },
    35: { name: 'LevelModificationAction', label: '🔧 Level Mod', color: '#607D8B', dataKey: 'LevelModificationAction' },
    36: { name: 'EndAmbushEarlyCausingRunAwayAction', label: '🏃 End Ambush', color: '#FF5722', dataKey: 'EndAmbushEarlyCausingRunAwayAction' },
    37: { name: 'RemoveStatueForSide', label: '🏛❌ Remove Statue', color: '#F44336', dataKey: 'RemoveStatueForSide' },
    38: { name: 'TimeScaleAction', label: '⏩ Time Scale', color: '#2196F3', dataKey: 'TimeScaleAction' },
    39: { name: 'GiveUpgradeBuilding', label: '🏗 Give Upgrade', color: '#8BC34A', dataKey: 'GiveUpgradeBuilding' },
  },
  
  // Difficulty enum
  DIFFICULTIES: { 0: 'Normal', 1: 'Hard', 2: 'Insane' },
  
  // Side enum
  SIDES: { 0: 'Left', 1: 'Right' },
  
  // Helper to get event summary text for display
  getEventSummary(eventObj) {
    let summary = '';
    const triggers = eventObj?.Triggers?.Array || [];
    const actions = eventObj?.Actions?.Array || [];
    
    if (triggers.length > 0) {
      const t = triggers[0];
      const tType = this.TRIGGER_TYPES[t.EventTriggerType];
      if (t.EventTriggerType === 0 && t.TimeTrigger) {
        const secs = this.fpToReal(t.TimeTrigger.Time?.RawValue || 0);
        summary += `@${secs.toFixed(1)}s`;
        if (t.TimeTrigger.IsRecurring) summary += ' (recurring)';
      } else if (tType) {
        summary += tType.label;
      }
    }
    
    if (actions.length > 0) {
      const a = actions[0];
      const aType = this.ACTION_TYPES[a.ActionType];
      if (aType) {
        summary += ` → ${aType.label}`;
        if (a.ActionType === 0 && a.SpawnUnits) {
          const units = a.SpawnUnits.Units?.Array || [];
          const totalCount = units.reduce((sum, u) => sum + (u.Number || 0), 0);
          summary += ` (${totalCount} units)`;
        }
      }
    }
    
    if (actions.length > 1) summary += ` +${actions.length - 1} more`;
    
    return summary || 'Empty Event';
  },
  
  // Get trigger time in seconds (for timeline positioning)
  getEventTriggerTime(eventObj) {
    const triggers = eventObj?.Triggers?.Array || [];
    if (triggers.length > 0 && triggers[0].EventTriggerType === 0) {
      return this.fpToReal(triggers[0].TimeTrigger?.Time?.RawValue || 0);
    }
    return -1; // Non-time trigger
  },
  
  // Create a blank event with a TimeTrigger and SpawnUnits action
  createBlankEvent(timeSec = 0) {
    return {
      DelayBeforeTakingActions: { RawValue: 0 },
      Triggers: { Array: [this.createBlankTrigger(0, timeSec)] },
      Actions: { Array: [this.createBlankAction(0)] }
    };
  },
  
  createBlankTrigger(type = 0, timeSec = 0) {
    return {
      EventTriggerType: type,
      TimeTrigger: {
        Time: { RawValue: this.realToFp(timeSec) },
        IsContinuous: 0,
        IsRecurring: 0,
        TimeBetween: { RawValue: this.realToFp(30) }
      },
      StatueHealthTrigger: { HealthRatio: { RawValue: 0 }, Side: 0, TeamIndex: 0 },
      ResourceTrigger: { Side: 0, TeamIndex: 0, Type: 0, min: 0, max: 0 },
      EntityStateTrigger: { Label: '', IsContinuous: 0, NegateLogic: 0, IsBeingUserControlled: 0, IsDead: 0, IsMiningCrystal: 0, DidJustShootBow: 0, HealthRatio: { RawValue: 0 }, IsAwake: 0 },
      RegisterTrigger: { Register: '', RegisterIndex: 0, RegisterTriggerType: 0, EqualsValue: 0 },
      UnitBuiltTrigger: { AssetRefSlottableSpec: { Id: { Value: 0 } }, Side: 0, TeamIndex: 0 },
      ArmyBuiltTrigger: { BuildArmyDatas: { Array: [] }, Side: 0, TeamIndex: 0 },
      UnitBuildingTrigger: { AssetRefSlottableSpec: { Id: { Value: 0 } }, Side: 0, TeamIndex: 0 },
      TeamStanceTrigger: { Side: 0, TeamIndex: 0, StanceType: 0 },
      StateMachineTrigger: { State: '', StateIndex: 0, OnEnterState: 0 },
      SpellCastTrigger: { Side: 0, TeamIndex: 0, AssetRefSlottableSpec: { Id: { Value: 0 } } },
      CameraTrigger: { Side: 0, TeamIndex: 0, PositionX: { RawValue: 0 }, BoundsX: { RawValue: 0 } },
      GeneralWasPickedTrigger: { AssetRefCampaignGeneralSpec: { Id: { Value: 0 } } },
      DifficultyTrigger: { DifficultiesToTriggerWith: { Array: [0] } },
      TeamDesperationTrigger: { Side: 0, TeamIndex: 0 },
      UpgradeBuildingTrigger: { Side: 0, TeamIndex: 0 }
    };
  },
  
  createBlankAction(type = 0) {
    return {
      ActionType: type,
      SpawnUnits: {
        Side: 1, TeamIndex: 0,
        Units: { Array: [] },
        SpawnAtPosition: 0,
        SpawnPosition: { X: { RawValue: 0 }, Y: { RawValue: 0 } },
        ShouldScaleWithTime: 0,
        ScaleEndTime: { RawValue: 26214400 },
        ScaleCurve: { Samples: { Array: [] }, PreWrapMode: 0, PostWrapMode: 0, StartTime: { RawValue: 0 }, EndTime: { RawValue: 0 }, Resolution: 0, OriginalPreWrapMode: 0, OriginalPostWrapMode: 0, Keys: { Array: [] } },
        AlwaysAttacks: 1, AlwaysAttacksStatue: 0, HoldPosition: 0,
        AddRandomnessToSpawnPosition: 0, NoGeneralRespawn: 0, NoGeneralInjured: 0,
        Label: '', SilentSpawn: 0, SleepTime: { RawValue: 0 }
      },
      SpawnGeneral: { Side: 0, TeamIndex: 0, SpawnAtPosition: 0, SpawnPosition: { X: { RawValue: 0 }, Y: { RawValue: 0 } }, Label: '', SilentSpawn: 0, AllowRespawn: 1 },
      CameraPan: { Type: 0, Label: '', Position: { RawValue: 0 }, Rate: { RawValue: 65536 }, MaxSpeed: { RawValue: 655360 }, UseCinematicCamera: 1, ZoomOutFromCinematicCamera: 0, ZoomCameraOnEntity: 0, HasInstantTransition: 0, EntityBoneToFollow: 0 },
      GiveSpeech: { Speech: '', TimeToShow: { RawValue: 0 }, SecondsToAnimateTextOver: { RawValue: 0 }, SideToShowOn: 0, LabeledUnit: '', Delay: { RawValue: 0 }, FmodSfx: { EventLabel: '' }, AssetRefTalkingAnimationSpec: { Id: { Value: 0 } } },
      UnitGestureAction: { LabeledUnit: '', GestureAnimationSpec: { Id: { Value: 0 } }, Delay: { RawValue: 0 }, Loop: 0 },
      ModifyUI: { Type: 0, ModificationSpec: { Id: { Value: 0 } } },
      UnitAiCommand: { Type: 0, LabeledUnit: '', Position: { X: { RawValue: 0 }, Y: { RawValue: 0 } }, DirectionToFace: 0, LabeledUnitTarget: '', IgnoreWorldBounds: 0 },
      FullScreenMessage: { Message: '' },
      MessagePopup: { Message: '', MessagePopupPlacement: 0, StepCompletedData: { IsCompleted: { Value: 0 }, ShouldShow: { Value: 0 }, StepNumber: 0, StepsTotal: 0 }, MessageSentiment: 0 },
      SetRegister: { Register: '', RegisterIndex: 0, ValueToSet: 0 },
      TellUserToPerformAction: { Type: 0, LabeledUnit: '', AssetRefUpgradeBuildingSpec: { Id: { Value: 0 } }, AssetRefSlottableSpec: { Id: { Value: 0 } }, MessagePopupToSelectEntity: { Message: '', MessagePopupPlacement: 0, StepCompletedData: { IsCompleted: { Value: 0 }, ShouldShow: { Value: 0 }, StepNumber: 0, StepsTotal: 0 }, MessageSentiment: 0 }, MessagePopup: { Message: '', MessagePopupPlacement: 0, StepCompletedData: { IsCompleted: { Value: 0 }, ShouldShow: { Value: 0 }, StepNumber: 0, StepsTotal: 0 }, MessageSentiment: 0 }, BuildArmySpecification: { Array: [] }, PauseAfterActionNotTakenFor: { RawValue: 0 } },
      LabelUnitBuiltFromQueue: { Label: '' },
      SpawnEntityPrototype: { AssetRefEntityPrototype: { Id: { Value: 0 } }, ShouldPlaceOnTeam: 0, SlottableSpecRefToLoadAtlasFrom: { Id: { Value: 0 } }, SideToPlaceOn: 0, TeamIndexToPlaceOn: 0, ShouldPlaceAtPosition: 0, PositionToPlaceAt: { X: { RawValue: 0 }, Y: { RawValue: 0 }, Z: { RawValue: 0 } } },
      GameObjectiveMessage: {},
      SetFogOfWar: { isFogOfWarEnabled: 0 },
      SetCapturePoint: { isCapturePointEnabled: 0 },
      SideWin: { Side: 0, ImmediatelyQuit: 0, AssetRefCutSceneFromCampaignStepSpec: { Id: { Value: 0 } }, ShouldFocusCameraOnPoint: 0, CameraFocusPoint: { RawValue: 0 }, NoCameraPanChangeOnWin: 0, ShouldDestroyStatue: 0 },
      CutSceneMode: { IsEnabled: 0, AllowUnitAiUpdates: 0 },
      ToggleNotificationPopups: { IsEnabled: 0 },
      TogglePause: { IsPaused: 0 },
      TeamAiCommand: { TeamAiCommandType: 0, Side: 0, TeamIndex: 0, FormationIndex: 0, MinerFormationCommand: 1 },
      GiveResearch: { AssetRefSlottableSpec: { Id: { Value: 0 } }, Side: 0, TeamIndex: 0 },
      StateMachine: { State: '', StateIndex: 0 },
      KeepUnitSelected: { Side: 0, TeamIndex: 0, Label: '' },
      KeepUnitAlive: { Label: '', ShouldKeepAlive: 0 },
      SetUserCommandsAvailable: { isUserSelectDeselectAvailable: 0, isUserControlAvailable: 0 },
      SetTutorialMineAndBuildTimes: { HasQuickBuildAndMineTimeForTutorial: 0 },
      ClearStage: { ClearStateType: 0, ClearTeamType: 0 },
      RemoveEntityAction: { Label: '' },
      PlayFmodEvent: { PlayFmodEventAction: 0, FmodSfx: { EventLabel: '' }, Label: '' },
      PlayVideoAsOverlay: { AssetRefVideoSpec: { Id: { Value: 0 } } },
      ToggleMusic: { ShouldPlay: 0 },
      RangedAttackOverrideAction: { Side: 0, TeamIndex: 0, Label: '', HasOverride: 0 },
      LoadSceneAdditive: { SceneName: '', LoadSceneAction: 0 },
      ReplaceBackdrop: { AssetRefBackDropSpec: { Id: { Value: 0 } } },
      LevelModificationAction: { LevelModificationSpec: { Id: { Value: 0 } } },
      EndAmbushEarlyCausingRunAwayAction: {},
      RemoveStatueForSide: { Side: 0, DisableBuildingUnits: 1, DisableCastleArchidon: 1 },
      TimeScaleAction: { GoalTimeScale: { RawValue: 65536 }, LerpRate: { RawValue: 65536 } },
      GiveUpgradeBuilding: { AssetRefUpgradeBuildingSpec: { Id: { Value: 0 } }, Side: 0, TeamIndex: 0, Level: 0 }
    };
  },
  
  createBlankSpawnUnit(unitValueId = 0) {
    return {
      AssetRefSlottableSpec: { Id: { Value: unitValueId } },
      Number: 1,
      DifficultiesToSpawnOn: { Array: [0, 1, 2] },
      AssetRefUnitLevelCustomizationSpec: { Id: { Value: 0 } }
    };
  },

  createBlankLevel(name) {
    return {
      m_GameObject: { m_FileID: 0, m_PathID: 0 },
      m_Enabled: 1,
      m_Script: { m_FileID: 1, m_PathID: 1876 },
      m_Name: name,
      Settings: {
        Identifier: {
          Path: `Resources/DB/Levels/${name}`,
          Guid: { Value: Math.floor(Math.random() * 9000000000000000000) }
        },
        Title: name,
        Description: '',
        TipOnLoss: '',
        MessageOnWin: '',
        AmbushEndingPrefix: 'Ambush Ending in',
        AmbushTimerShowNormalizedOffset: { RawValue: 0 },
        MaxPopulationOverride: 0,
        Version: 0,
        LevelVariations: {
          Normal: { Id: { Value: 4482928378259185333 } },
          Hard: { Id: { Value: 78022690482194471 } },
          Insane: { Id: { Value: 2603209465997266451 } },
          Challenges: { Array: [] }
        },
        AssetRefBackDropSpecOverride: { Id: { Value: 0 } },
        AssetRefBackDropTimeOfDaySpec: { Id: { Value: 0 } },
        LevelAlterations: {
          LeftBaseOffsetTowardsMiddle: { RawValue: 0 },
          RightBaseOffsetTowardsMiddle: { RawValue: 0 }
        },
        AssetRefGameTypeSpec: { Id: { Value: 1760897614566902726 } },
        GameFeatures: {
          AllGeneralsToHaveDefaultColour: { Value: 0 },
          AmbushWinCondition: { AmbushingSideCastleArchidonCount: 0, DisableAmbushEndEarlyIfUnitsOrSpawnGroupsLeft: { Value: 0 }, DisableWinAtEndOfAmbush: { Value: 0 }, IsAmbush: { Value: 0 }, SideThatIsBeingAmbushed: 0, SpawnMinersForAttackingSide: { Value: 0 }, TimeToSurviveFor: { RawValue: 0 } },
          DisableAbilityCooldowns: { Value: 0 }, DisableAiUpdates: { Value: 0 }, DisableAutoSpawnGeneral: { Value: 0 }, DisableBuildQueue: { Value: 0 }, DisableCapturePointBuildSpeedBonusAfterTime: { Value: 0 }, DisableCapturePoints: { Value: 1 }, DisableCenterTowerExtraBonusEffects: { Value: 0 }, DisableCenterTowerExtraBonusEffectsOnNormalDifficulty: { Value: 0 }, DisableCheerOnWin: { Value: 0 }, DisableDamageEffects: { Value: 0 }, DisableFogOfWar: { Value: 0 }, DisableGeneralAiImprovements: { Value: 0 }, DisableGeneralRespawnOnNormalDifficulty: { Value: 0 }, DisableGeneralsArmy: { Value: 0 }, DisableGeneralsPassiveHeal: { Value: 0 }, DisableHealthBars: { Value: 0 }, DisableHiddenSlottableSpecs: { Value: 0 }, DisableIdleAnimations: { Value: 0 }, DisableNotificationPopups: { Value: 0 }, DisableResearchUpgradesPastLevel1OnNormalDifficulty: { Value: 0 }, DisableRubberBanding: { Value: 0 }, DisableSpawnMiners: { Value: 0 }, DisableStatisticAndAchievementProgress: { Value: 0 }, DisableStatueWinCondition: { Value: 0 }, DisableTeamAiUpdates: { Value: 0 }, DisableUnitControlCommands: { Value: 0 }, DisableUnitSelectDeselectCommands: { Value: 0 }, DisableUpgradeBuildingSystem: { Value: 0 }, DisableUserCustomLoadout: { Value: 0 }, FadeToBlackOnWin: { Value: 0 }, HasCapturePointWinCondition: { Value: 0 }, HasGeneralDeathWinCondition: { Value: 0 }, HasQuickBuildAndMineTimeForTutorial: { Value: 0 }, HideMatchCountdownIntroduction: { Value: 1 }, IsInCutsceneMode: { Value: 0 }, PlayVideoOnWin: { Id: { Value: 0 } }, RemindersEnabled: { Value: 0 }, ShowGameObjectiveMessage: { Value: 0 }, TeamAiMayUserControl: { Value: 0 }, TeamAiOnlyUserControlGenerals: { Value: 0 }, UnitBuildTimeModifier: { RawValue: 0 }
        },
        AssetRefMinePositioningSpec: { Id: { Value: 0 } },
        LeftTeams: { Array: [{
          TeamName: 'User', AllowPlayersLoadoutOverride: 1,
          Loadout: { Array: [] }, ExtraSlotsForDifficulty: { Array: [] },
          AssetRefProfilePicSpec: { Id: { Value: 0 } },
          AssetRefAiUpgradeBuildingResearchPlanSpec: { Id: { Value: 0 } },
          AssetRefStatuePersonalizationSpec: { Id: { Value: 0 } },
          AssetRefBannerPersonalizationSpec: { Id: { Value: 0 } },
          AssetRefWallPersonalizationSpec: { Id: { Value: 0 } },
          OverrideStatueHealth: 0, StatueHealth: 1500,
          StartingGold: 500, StartingMana: 0, StartingMiners: 2,
          TeamAiParameters: { MaxCastleArchersOnNormal: 0, MaxMiners: 0, MaxPopulation: 0, MilitaryFractionToAttackAt: { RawValue: 0 }, OnlyGarrisonIfMilitaryPopulationLowerThan: 0, SecondsBeforeCanAttack: { RawValue: 0 }, SecondsBeforeCanLeaveBase: { RawValue: 0 }, StrengthToAttackAt: 0, StrengthToRetreatAt: 0 },
          AiBuildTargets: { Array: [] }, Customizations: { Array: [] },
          DefaultCampaignGeneralSpec: { Id: { Value: 0 } },
          Techs: { Array: [] },
          Desperation: { HasDesperation: 0, HasTemporaryStatueProtection: 1, StatueHealthFractionToTriggerAt: { RawValue: 16384 }, Message: '', UnitsToSpawn: { Array: [] } }
        }] },
        RightTeams: { Array: [{
          TeamName: 'Enemy', AllowPlayersLoadoutOverride: 0,
          Loadout: { Array: [] }, ExtraSlotsForDifficulty: { Array: [] },
          AssetRefProfilePicSpec: { Id: { Value: 0 } },
          AssetRefAiUpgradeBuildingResearchPlanSpec: { Id: { Value: 0 } },
          AssetRefStatuePersonalizationSpec: { Id: { Value: 0 } },
          AssetRefBannerPersonalizationSpec: { Id: { Value: 0 } },
          AssetRefWallPersonalizationSpec: { Id: { Value: 0 } },
          OverrideStatueHealth: 0, StatueHealth: 1500,
          StartingGold: 500, StartingMana: 0, StartingMiners: 2,
          TeamAiParameters: { MaxCastleArchersOnNormal: 0, MaxMiners: 3, MaxPopulation: 8, MilitaryFractionToAttackAt: { RawValue: 0 }, OnlyGarrisonIfMilitaryPopulationLowerThan: 0, SecondsBeforeCanAttack: { RawValue: 0 }, SecondsBeforeCanLeaveBase: { RawValue: 0 }, StrengthToAttackAt: 5, StrengthToRetreatAt: 2 },
          AiBuildTargets: { Array: [] }, Customizations: { Array: [] },
          DefaultCampaignGeneralSpec: { Id: { Value: 0 } },
          Techs: { Array: [] },
          Desperation: { HasDesperation: 0, HasTemporaryStatueProtection: 1, StatueHealthFractionToTriggerAt: { RawValue: 16384 }, Message: '', UnitsToSpawn: { Array: [] } }
        }] },
        Events: { Array: [] },
        LabelIndices: { Array: [] }
      },
      musicCollectionOverride: { m_FileID: 0, m_PathID: 0 },
      achievementForCompletion: { m_FileID: 0, m_PathID: 0 },
      canShowAdsAfterLevel: 0,
      localizationSuffix: '',
      ShouldHideFromLocalization: 0
    };
  }
};

window.YAMLParser = {
  parseAssetResources(yamlText) {
    const results = [];
    const lines = yamlText.split('\n');
    let currentEntry = null;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (line.startsWith('- Path:')) {
        if (currentEntry && currentEntry.path && currentEntry.value) {
          results.push(currentEntry);
        }
        currentEntry = { path: line.substring(7).trim() };
      } else if (currentEntry) {
        if (line.startsWith('Value:')) {
          currentEntry.value = line.substring(6).trim();
        } else if (line.startsWith('Address:')) {
          currentEntry.address = line.substring(8).trim();
        } else if (line.startsWith('ResourcePath:')) {
          currentEntry.address = line.substring(13).trim();
        }
      }
    }
    if (currentEntry && currentEntry.path && currentEntry.value) {
      results.push(currentEntry);
    }
    return results;
  },

  parseSlottableAsset(yamlText) {
    const lines = yamlText.split('\n');
    const result = {
      mName: '',
      path: '',
      guidValue: '',
      name: '',
      description: '',
      cost: { gold: 0, mana: 0, population: 0 },
      isBuildableUnit: 0,
      slotType: -1
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('m_Name:')) result.mName = line.substring(7).trim();
      if (line.startsWith('Path:') && !result.path) result.path = line.substring(5).trim();
      if (line.startsWith('Value:') && !result.guidValue) result.guidValue = line.substring(6).trim();
      if (line.startsWith('Name:') && !result.name) result.name = line.substring(5).trim();
      if (line.startsWith('Description:')) result.description = line.substring(12).trim();
      if (line.startsWith('Gold:')) result.cost.gold = parseInt(line.substring(5).trim()) || 0;
      if (line.startsWith('Mana:')) result.cost.mana = parseInt(line.substring(5).trim()) || 0;
      if (line.startsWith('Population:')) result.cost.population = parseInt(line.substring(11).trim()) || 0;
      if (line.startsWith('IsBuildableUnit:')) result.isBuildableUnit = parseInt(line.substring(16).trim()) || 0;
      if (line.startsWith('slotType:')) result.slotType = parseInt(line.substring(9).trim());
    }
    return result;
  },

  parseGenericAsset(yamlText) {
    const lines = yamlText.split('\n');
    const result = {
      mName: '',
      path: '',
      guidValue: '',
      name: '',
      title: '',
      description: '',
      isBuildableUnit: undefined,
      slotType: -1
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('m_Name:')) result.mName = line.substring(7).trim();
      if (line.startsWith('Path:') && !result.path) result.path = line.substring(5).trim();
      if (line.startsWith('Value:') && !result.guidValue) result.guidValue = line.substring(6).trim();
      if (line.startsWith('Name:') && !result.name) result.name = line.substring(5).trim();
      if (line.startsWith('Title:') && !result.title) result.title = line.substring(6).trim();
      if (line.startsWith('Description:')) result.description = line.substring(12).trim();
      if (line.startsWith('IsBuildableUnit:')) result.isBuildableUnit = parseInt(line.substring(16).trim()) || 0;
      if (line.startsWith('slotType:')) result.slotType = parseInt(line.substring(9).trim());
    }
    return result;
  }
};

window.IDBCache = {
  DB_NAME: 'SWSLevelStudio',
  DB_VERSION: 1,
  _db: null,
  
  async open() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this._db = request.result;
        resolve(this._db);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('metadata')) db.createObjectStore('metadata');
        if (!db.objectStoreNames.contains('levels')) db.createObjectStore('levels');
        if (!db.objectStoreNames.contains('workspace')) db.createObjectStore('workspace');
      };
    });
  },
  
  async get(storeName, key) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async put(storeName, key, value) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).put(value, key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async delete(storeName, key) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async getAll(storeName) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async clearAll() {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(['metadata', 'levels', 'workspace'], 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore('metadata').clear();
      tx.objectStore('levels').clear();
      tx.objectStore('workspace').clear();
    });
  },

  async saveMetadata(data) { await this.put('metadata', 'current', { data, timestamp: Date.now(), version: 3 }); },
  async loadMetadata() { return await this.get('metadata', 'current'); },
  async saveLevel(filename, jsonData) { await this.put('levels', filename, { data: jsonData, timestamp: Date.now() }); },
  async loadLevel(filename) { return await this.get('levels', filename); },
  async saveWorkspace(state) { await this.put('workspace', 'current', state); },
  async loadWorkspace() { return await this.get('workspace', 'current'); },
};

window.MetadataDB = {
  _db: new Map(),
  _loaded: false,

  // ═══ SOURCE PRIORITY (lower = higher priority) ═══
  _SOURCE_PRIORITY: {
    'SlottableYAML': 1,
    'CampaignYAML': 2,
    'GenericDB': 3,
    'AssetResources': 4,
    'EntityYAML': 5,
    'Prefab': 6,
    'Unknown': 9
  },

  // ═══ CAMELCASE SPLITTER ═══
  _splitCamelCase(name) {
    if (!name) return '';
    // Don't split all-caps (VFX, AI, etc.)
    if (name === name.toUpperCase()) return name;
    // Insert space before uppercase letters that follow lowercase
    return name
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .trim();
  },

  // ═══ CATEGORY FROM PATH ═══
  _categoryFromPath(pathOrFile) {
    const p = (pathOrFile || '').toLowerCase().replace(/\\/g, '/');
    // Slottable sub-paths (most specific first)
    if (p.includes('/slottables/campaign/generals/') || p.includes('/generals/')) return 'General';
    if (p.includes('/slottables/spell/') || p.includes('/spells/')) return 'Spell';
    if (p.includes('/slottables/research/')) return 'Research';
    if (p.includes('/slottables/tech/')) return 'Tech';
    if (p.includes('/slottables/upgradebuildings/')) return 'UpgradeBuilding';
    if (p.includes('/slottables/difficulty/')) return 'Difficulty';
    if (p.includes('/slottables/hidden/')) return 'Hidden';
    if (p.includes('/slottables/views/')) return 'SlottableView';
    if (p.includes('/levels/') || p.includes('/cutscenes/')) return 'Level';
    if (p.includes('/slottables/campaign/')) return 'Unit';
    if (p.includes('/slottables/')) return 'Slottable';
    // Other game DB paths
    if (p.includes('/equipment/')) return 'Equipment';
    if (p.includes('/gametype/')) return 'GameType';
    if (p.includes('/upgradebuildings/')) return 'UpgradeBuilding';
    if (p.includes('/statues/')) return 'Statue';
    if (p.includes('/walls/')) return 'Wall';
    if (p.includes('/backdrop/')) return 'BackDrop';
    if (p.includes('/banners/') || p.includes('/banner/')) return 'Banner';
    if (p.includes('/profilepics/') || p.includes('/profilepic/')) return 'ProfilePic';
    if (p.includes('/skin/') || p.includes('/skins/')) return 'Skin';
    if (p.includes('/music/')) return 'Music';
    if (p.includes('/video/')) return 'Video';
    // Technical / runtime
    if (p.includes('/entities/') || p.includes('/entityview/')) return 'Entity';
    if (p.includes('/vfx/')) return 'VFX';
    if (p.includes('/aiteams/')) return 'AITeam';
    if (p.includes('/levelvariants/')) return 'LevelVariant';
    if (p.includes('/capturepoint/')) return 'CapturePoint';
    if (p.includes('/projectile/')) return 'Projectile';
    if (p.includes('/localization/')) return 'Localization';
    if (p.includes('/spine/')) return 'Spine';
    if (p.includes('/sfx/')) return 'SFX';
    if (p.includes('/unitcustomizations/')) return 'UnitCustomization';
    if (p.includes('/techtrees/')) return 'TechTree';
    return 'Unknown';
  },

  // ═══ SOURCE PRIORITY FROM PATH ═══
  _sourcePriorityFromPath(pathOrFile) {
    const p = (pathOrFile || '').toLowerCase().replace(/\\/g, '/');
    if (p.includes('/slottables/campaign/generals/')) return 2;
    if (p.includes('/slottables/campaign/')) return 2;
    if (p.includes('/slottables/')) return 1;
    if (p.includes('/db/') && !p.includes('/entities/') && !p.includes('/spine/')) return 3;
    if (p.includes('/entities/') || p.includes('/entityview/')) return 5;
    if (p.includes('/spine/') || p.includes('/vfx/')) return 6;
    return 4;
  },

  // ═══ DISPLAY NAME EXTRACTION ═══
  _extractDisplayName(pathOrAddress) {
    if (!pathOrAddress) return '';
    // Get filename from path
    const pipeIdx = pathOrAddress.lastIndexOf('|');
    let raw;
    if (pipeIdx !== -1) {
      const slashIdx = pathOrAddress.lastIndexOf('/', pipeIdx);
      raw = pathOrAddress.substring(slashIdx + 1, pipeIdx);
    } else {
      const slashIdx = pathOrAddress.lastIndexOf('/');
      raw = pathOrAddress.substring(slashIdx + 1);
    }
    // Remove file extension
    raw = raw.replace(/\.(asset|prefab|json|yaml)$/i, '');
    // CamelCase split
    return this._splitCamelCase(raw);
  },

  // ═══ SEARCH KEYWORDS ═══
  _generateKeywords(entry) {
    const kw = new Set();
    if (entry.DisplayName) {
      kw.add(entry.DisplayName.toLowerCase());
      entry.DisplayName.split(' ').forEach(w => { if (w.length > 1) kw.add(w.toLowerCase()); });
    }
    if (entry.InternalName) kw.add(entry.InternalName.toLowerCase());
    (entry.Aliases || []).forEach(a => {
      kw.add(a.toLowerCase());
      a.split(' ').forEach(w => { if (w.length > 1) kw.add(w.toLowerCase()); });
    });
    if (entry.Category) kw.add(entry.Category.toLowerCase());
    return Array.from(kw);
  },

  // ═══ SMART MERGE (respects source priority) ═══
  _mergeEntry(idStr, newData) {
    const existing = this._db.get(idStr);
    if (!existing) {
      // New entry — set everything
      newData.Aliases = newData.Aliases || [];
      newData.SearchKeywords = this._generateKeywords(newData);
      this._db.set(idStr, newData);
      return;
    }

    const existPri = existing.SourcePriority || 9;
    const newPri = newData.SourcePriority || 9;

    // Collect alias — add old name if different from new name
    if (!existing.Aliases) existing.Aliases = [];
    if (newData.DisplayName && existing.DisplayName &&
        newData.DisplayName !== existing.DisplayName &&
        !existing.Aliases.includes(newData.DisplayName) &&
        !existing.Aliases.includes(existing.DisplayName)) {
      // Keep lower-priority name as alias
      if (newPri < existPri) {
        existing.Aliases.push(existing.DisplayName);
      } else {
        existing.Aliases.push(newData.DisplayName);
      }
    }

    // Higher priority source wins for DisplayName
    if (newPri < existPri) {
      existing.DisplayName = newData.DisplayName || existing.DisplayName;
      existing.SourcePriority = newPri;
      existing.Source = newData.Source || existing.Source;
    }

    // Category: Gameplay categories NEVER overridden by technical categories
    const gameplayCategories = ['Unit', 'General', 'Spell', 'Research', 'Equipment', 'Slottable', 'Tech', 'UpgradeBuilding'];
    const technicalCategories = ['Entity', 'VFX', 'Prefab', 'Projectile', 'Spine', 'SFX', 'Other', 'Unknown'];
    if (gameplayCategories.includes(newData.Category) && technicalCategories.includes(existing.Category)) {
      // Gameplay always beats technical
      existing.Category = newData.Category;
    } else if (technicalCategories.includes(newData.Category) && gameplayCategories.includes(existing.Category)) {
      // Technical NEVER beats gameplay — keep existing
    } else if (newPri < existPri && newData.Category && newData.Category !== 'Unknown') {
      existing.Category = newData.Category;
    }

    // Merge other fields (don't overwrite with empty)
    if (newData.Description && !existing.Description) existing.Description = newData.Description;
    if (newData.IsBuildableUnit !== undefined) existing.IsBuildableUnit = newData.IsBuildableUnit;
    if (newData.SlotType !== undefined && newData.SlotType >= 0) existing.SlotType = newData.SlotType;
    if (newData.InternalName && !existing.InternalName) existing.InternalName = newData.InternalName;
    if (newData.Path && !existing.Path) existing.Path = newData.Path;
    if (newData.Address && !existing.Address) existing.Address = newData.Address;

    // Use SlotType for definitive classification: 5=General, 3=Spell, 0=Unit
    const SLOT_TYPE_MAP = {0:'Unit', 1:'UpgradeBuilding', 2:'Equipment', 3:'Spell', 4:'Unit', 5:'General'};
    if (existing.SlotType >= 0 && SLOT_TYPE_MAP[existing.SlotType] &&
        (existing.Category === 'Slottable' || existing.Category === 'Unit' || existing.Category === 'Unknown')) {
      existing.Category = SLOT_TYPE_MAP[existing.SlotType];
    }
    // Fallback: Upgrade Slottable category to Unit if IsBuildableUnit
    else if (existing.Category === 'Slottable' && existing.IsBuildableUnit) existing.Category = 'Unit';

    // Regenerate keywords
    existing.SearchKeywords = this._generateKeywords(existing);
    this._db.set(idStr, existing);
  },

  // ═══ CORE API ═══
  async loadFromFile(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    this._ingest(data);
  },

  async loadFromUrl(url) {
    const resp = await fetch(url);
    const data = await resp.json();
    this._ingest(data);
  },

  _ingest(data) {
    this._db.clear();
    for (const [id, entry] of Object.entries(data)) {
      this._db.set(String(id), entry);
    }
    this._loaded = true;
    try { localStorage.setItem('sws_metadata_count', this._db.size.toString()); } catch(e) {}
  },

  isLoaded() { return this._loaded; },
  size() { return this._db.size; },

  resolve(longId) {
    const idStr = String(longId);
    if (idStr === '0' || idStr === '') return null;
    const entry = this._db.get(idStr);
    return entry ? entry.DisplayName : null;
  },

  resolveWithFallback(longId) {
    const idStr = String(longId);
    if (idStr === '0' || idStr === '') return '(none)';
    return this.resolve(longId) || `Unknown (${idStr})`;
  },

  getEntry(longId) {
    return this._db.get(String(longId)) || null;
  },

  // ═══ SMART SEARCH (includes aliases + keywords) ═══
  search(query, category = null) {
    const q = query.toLowerCase();
    const results = [];
    for (const [id, entry] of this._db) {
      if (category && entry.Category !== category) continue;
      // Hide technical assets from non-categorized search
      if (!category && ['Entity', 'VFX', 'Prefab', 'Projectile'].includes(entry.Category)) continue;
      const match =
        (entry.DisplayName || '').toLowerCase().includes(q) ||
        (entry.InternalName || '').toLowerCase().includes(q) ||
        (entry.Aliases || []).some(a => a.toLowerCase().includes(q)) ||
        (entry.SearchKeywords || []).some(k => k.includes(q));
      if (match) results.push(entry);
    }
    return results.sort((a, b) => (a.DisplayName || '').localeCompare(b.DisplayName || '')).slice(0, 100);
  },

  getByCategory(category) {
    const results = [];
    for (const [id, entry] of this._db) {
      if (entry.Category === category) results.push(entry);
    }
    return results.sort((a, b) => (a.DisplayName || '').localeCompare(b.DisplayName || ''));
  },

  getCategories() {
    const cats = new Set();
    for (const [id, entry] of this._db) {
      if (entry.Category) cats.add(entry.Category);
    }
    return Array.from(cats).sort();
  },

  // ═══ BUILD FROM ASSETRESOURCES (Priority 4) ═══
  buildFromAssetResources(yamlText) {
    const entries = window.YAMLParser.parseAssetResources(yamlText);
    // Sort: process Entity/VFX/Spine FIRST, then Slottable LAST
    // so Slottable merge wins over Entity for same GUID
    const priorityOrder = (path) => {
      const p = (path || '').toLowerCase();
      if (p.includes('/slottables/')) return 90; // Process last (wins merge)
      if (p.includes('/entities/')) return 10;   // Process first
      if (p.includes('/spine/')) return 5;
      if (p.includes('/vfx/')) return 5;
      return 50;
    };
    entries.sort((a, b) => priorityOrder(a.path) - priorityOrder(b.path));

    for (const entry of entries) {
      const category = this._categoryFromPath(entry.path);
      const displayName = this._extractDisplayName(entry.path) ||
                          this._extractDisplayName(entry.address) || '';

      this._mergeEntry(String(entry.value), {
        Id: String(entry.value),
        DisplayName: displayName,
        InternalName: displayName,
        Category: category,
        Source: 'AssetResources',
        SourcePriority: 4,
        Path: entry.path,
        Address: entry.address || ''
      });
    }
    this._loaded = true;
  },

  // ═══ ENRICH FROM SLOTTABLE YAML (Priority 1-2) ═══
  enrichFromSlottable(yamlText, filePath) {
    const data = window.YAMLParser.parseSlottableAsset(yamlText);
    if (data.guidValue) {
      const idStr = String(data.guidValue);
      const rawName = data.name || data.mName || '';
      const displayName = this._splitCamelCase(rawName);

      // Determine category from path first, then IsBuildableUnit
      const fp = (filePath || data.path || '').toLowerCase();
      let category = 'Slottable';
      let priority = 1;
      if (fp.includes('/campaign/generals/') || fp.includes('/generals/')) { category = 'General'; priority = 2; }
      else if (fp.includes('/spell/') || fp.includes('/spells/')) category = 'Spell';
      else if (fp.includes('/research/')) category = 'Research';
      else if (fp.includes('/tech/')) category = 'Tech';
      else if (fp.includes('/upgradebuildings/')) category = 'UpgradeBuilding';
      else if (fp.includes('/levels/') || fp.includes('/cutscenes/')) category = 'Level';
      else if (fp.includes('/campaign/')) { category = 'Unit'; priority = 2; }
      else if (data.isBuildableUnit) category = 'Unit';

      // slotType: 0=Unit, 1=Upgrade, 2=Enchantment, 3=Spell, 4=Mythic, 5=General
      const SLOT_TYPE_MAP = {0:'Unit', 1:'UpgradeBuilding', 2:'Equipment', 3:'Spell', 4:'Unit', 5:'General'};
      if (category === 'Slottable' && data.slotType >= 0 && SLOT_TYPE_MAP[data.slotType]) {
        category = SLOT_TYPE_MAP[data.slotType];
      }

      this._mergeEntry(idStr, {
        Id: idStr,
        DisplayName: displayName,
        InternalName: rawName,
        Category: category,
        Source: 'SlottableYAML',
        SourcePriority: priority,
        Description: data.description || '',
        IsBuildableUnit: data.isBuildableUnit,
        SlotType: data.slotType,
        Path: data.path || filePath || '',
        Cost: data.cost
      });
    }
  },

  // ═══ ENRICH FROM GENERIC ASSET YAML (Priority varies by path) ═══
  enrichFromGenericAsset(yamlText, filePath) {
    const data = window.YAMLParser.parseGenericAsset(yamlText);
    if (data.guidValue) {
      const idStr = String(data.guidValue);
      const rawName = data.title || data.name || data.mName || '';
      const displayName = this._splitCamelCase(rawName);
      const category = this._categoryFromPath(filePath);
      const priority = this._sourcePriorityFromPath(filePath);

      this._mergeEntry(idStr, {
        Id: idStr,
        DisplayName: displayName,
        InternalName: rawName,
        Category: category,
        Source: 'GenericYAML',
        SourcePriority: priority,
        Path: data.path || filePath,
        Description: data.description || '',
        IsBuildableUnit: data.isBuildableUnit
      });
    }
  },

  // ═══ CACHE ═══
  async saveToCache() {
    const obj = Object.fromEntries(this._db);
    await window.IDBCache.saveMetadata(obj);
  },

  async loadFromCache() {
    const cached = await window.IDBCache.loadMetadata();
    if (cached && cached.data) {
      this._ingest(cached.data);
      return true;
    }
    return false;
  },

  // ═══ GAMEPLAY GETTERS (exclude technical assets) ═══
  getUnits() {
    const results = [];
    for (const [id, entry] of this._db) {
      if (entry.Category === 'Unit' ||
          (entry.Category === 'Slottable' && entry.IsBuildableUnit) ||
          (entry.Category === 'Slottable' && this._isRootSlottable(entry))) {
        results.push(entry);
      }
    }
    return results.sort((a, b) => (a.DisplayName || '').localeCompare(b.DisplayName || ''));
  },

  // Heuristic: root-level slottables (no subfolder) are likely spawnable units
  _isRootSlottable(entry) {
    const p = (entry.Path || '').toLowerCase().replace(/\\/g, '/');
    // Match DB/Slottables/Name (no further subfolder)
    const m = p.match(/\/slottables\/([^/]+)$/);
    return !!m;
  },

  getGenerals() {
    return this.getByCategory('General');
  },

  getSpells() {
    return this.getByCategory('Spell');
  },

  // ═══ BUILD FROM FOLDER (webkitdirectory FileList) ═══
  async buildFromFolder(fileList, progressCb) {
    const stats = { total: 0, assetRes: 0, slottables: 0, entities: 0, spells: 0, other: 0, skipped: 0 };
    const files = Array.from(fileList);
    const assetFiles = files.filter(f => f.name.endsWith('.asset') && !f.name.endsWith('.meta'));
    stats.total = assetFiles.length;

    // Pass 1: Find and process AssetResources.asset (base layer, Priority 4)
    for (const file of assetFiles) {
      if (file.name === 'AssetResources.asset') {
        if (progressCb) progressCb('Building base from AssetResources...');
        const text = await file.text();
        this.buildFromAssetResources(text);
        stats.assetRes = this._db.size;
        break;
      }
    }

    // Pass 2: Enrich with slottable .asset files (Priority 1-2)
    let processed = 0;
    for (const file of assetFiles) {
      const rp = (file.webkitRelativePath || '').toLowerCase().replace(/\\/g, '/');
      if (!rp.includes('/db/slottables/')) continue;
      if (rp.includes('/views/')) { stats.skipped++; continue; }
      try {
        const text = await file.text();
        this.enrichFromSlottable(text, file.webkitRelativePath);
        stats.slottables++;
      } catch(e) { stats.skipped++; }
      processed++;
      if (progressCb && processed % 50 === 0) progressCb(`Scanning slottables: ${processed}...`);
    }

    // Pass 3: Enrich with entity .asset files (Priority 5, fallback only)
    for (const file of assetFiles) {
      const rp = (file.webkitRelativePath || '').toLowerCase().replace(/\\/g, '/');
      if (!rp.includes('/db/entities/')) continue;
      try {
        const text = await file.text();
        this.enrichFromGenericAsset(text, file.webkitRelativePath);
        stats.entities++;
      } catch(e) { stats.skipped++; }
    }

    // Pass 4: Enrich with spell .asset files
    for (const file of assetFiles) {
      const rp = (file.webkitRelativePath || '').toLowerCase().replace(/\\/g, '/');
      if (!rp.includes('/db/spells/')) continue;
      if (!rp.includes('prototype')) continue; // Only EntityPrototype, not EntityView
      try {
        const text = await file.text();
        this.enrichFromGenericAsset(text, file.webkitRelativePath);
        stats.spells++;
      } catch(e) { stats.skipped++; }
    }

    this._loaded = true;
    return stats;
  },

  // ═══ EXPORT METADATA AS DOWNLOADABLE JSON ═══
  exportMetadataBlob() {
    const obj = Object.fromEntries(this._db);
    const json = JSON.stringify(obj, null, 2);
    return new Blob([json], { type: 'application/json' });
  },

  // ═══ BUILD STATS ═══
  buildStats() {
    const cats = {};
    for (const [id, entry] of this._db) {
      const c = entry.Category || 'Unknown';
      cats[c] = (cats[c] || 0) + 1;
    }
    return { total: this._db.size, categories: cats };
  }
};

window.LevelParser = {
  _data: null,
  _fileName: '',
  _dirty: false,
  _undoStack: [],
  _redoStack: [],
  _maxUndo: 50,
  
  load(jsonString, fileName) {
    try {
      this._data = safeParse(jsonString);
      this._fileName = fileName;
      this._dirty = false;
      this._undoStack = [];
      this._redoStack = [];
      this._pushUndo();
      return true;
    } catch(e) {
      console.error('Parse error:', e);
      return false;
    }
  },
  
  isLoaded() { return this._data !== null; },
  isDirty() { return this._dirty; },
  getFileName() { return this._fileName; },
  getData() { return this._data; },
  
  get(path) {
    const parts = path.split('.');
    let obj = this._data;
    for (const p of parts) {
      if (obj == null) return undefined;
      if (/^\d+$/.test(p)) obj = obj[parseInt(p)];
      else obj = obj[p];
    }
    return obj;
  },
  
  set(path, value) {
    this._pushUndo();
    const parts = path.split('.');
    let obj = this._data;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (/^\d+$/.test(p)) obj = obj[parseInt(p)];
      else obj = obj[p];
      if (obj == null) return false;
    }
    const lastKey = parts[parts.length - 1];
    if (/^\d+$/.test(lastKey)) obj[parseInt(lastKey)] = value;
    else obj[lastKey] = value;
    this._dirty = true;
    return true;
  },
  
  getName() { return this._data?.m_Name || ''; },
  getSettings() { return this._data?.Settings; },
  getLeftTeams() { return this._data?.Settings?.LeftTeams?.Array || []; },
  getRightTeams() { return this._data?.Settings?.RightTeams?.Array || []; },
  getEvents() { return this._data?.Settings?.Events?.Array || []; },
  getGameFeatures() { return this._data?.Settings?.GameFeatures; },
  
  addEvent(eventObj) {
    this._pushUndo();
    if (!this._data.Settings.Events) this._data.Settings.Events = { Array: [] };
    this._data.Settings.Events.Array.push(eventObj);
    this._dirty = true;
  },
  
  removeEvent(index) {
    this._pushUndo();
    const events = this.getEvents();
    if (index >= 0 && index < events.length) {
      events.splice(index, 1);
      this._dirty = true;
    }
  },
  
  duplicateEvent(index) {
    this._pushUndo();
    const events = this.getEvents();
    if (index >= 0 && index < events.length) {
      const clone = JSON.parse(JSON.stringify(events[index]));
      events.splice(index + 1, 0, clone);
      this._dirty = true;
    }
  },
  
  moveEvent(fromIndex, toIndex) {
    this._pushUndo();
    const events = this.getEvents();
    if (fromIndex >= 0 && fromIndex < events.length && toIndex >= 0 && toIndex < events.length) {
      const [removed] = events.splice(fromIndex, 1);
      events.splice(toIndex, 0, removed);
      this._dirty = true;
    }
  },
  
  addSpawnUnit(eventIndex, actionIndex, unitEntry) {
    this._pushUndo();
    const action = this.getEvents()[eventIndex]?.Actions?.Array?.[actionIndex];
    if (action && action.SpawnUnits) {
      if (!action.SpawnUnits.Units) action.SpawnUnits.Units = { Array: [] };
      action.SpawnUnits.Units.Array.push(unitEntry);
      this._dirty = true;
    }
  },
  
  removeSpawnUnit(eventIndex, actionIndex, unitIndex) {
    this._pushUndo();
    const units = this.getEvents()[eventIndex]?.Actions?.Array?.[actionIndex]?.SpawnUnits?.Units?.Array;
    if (units && unitIndex >= 0 && unitIndex < units.length) {
      units.splice(unitIndex, 1);
      this._dirty = true;
    }
  },
  
  serialize() {
    return safeSerialize(this._data);
  },
  
  _pushUndo() {
    if (this._data) {
      if (this._undoStack.length >= this._maxUndo) this._undoStack.shift();
      this._undoStack.push(JSON.stringify(this._data));
      this._redoStack = [];
    }
  },
  
  undo() {
    if (this._undoStack.length > 1) {
      this._redoStack.push(this._undoStack.pop());
      this._data = JSON.parse(this._undoStack[this._undoStack.length - 1]);
      this._dirty = true;
      return true;
    }
    return false;
  },
  
  redo() {
    if (this._redoStack.length > 0) {
      const state = this._redoStack.pop();
      this._undoStack.push(state);
      this._data = JSON.parse(state);
      this._dirty = true;
      return true;
    }
    return false;
  },
  
  createBlank(name = 'New_Level') {
    this._data = window.Schema.createBlankLevel(name);
    this._fileName = `${name}.json`;
    this._dirty = true;
    this._undoStack = [];
    this._redoStack = [];
    this._pushUndo();
  },
  
  duplicate(newName) {
    this._pushUndo();
    const clone = JSON.parse(JSON.stringify(this._data));
    clone.m_Name = newName;
    clone.Settings.Identifier.Path = `Resources/DB/Levels/${newName}`;
    clone.Settings.Identifier.Guid.Value = Math.floor(Math.random() * 9000000000000000000);
    this._data = clone;
    this._fileName = `${newName}.json`;
    this._dirty = true;
  },

  async autoSave() {
    if (this._data && this._fileName) {
      await window.IDBCache.saveLevel(this._fileName, this._data);
    }
  },
  
  async checkAutoSave(filename) {
    return await window.IDBCache.loadLevel(filename);
  },
  
  countKeys(obj = this._data, depth = 0) {
    let count = 0;
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        count++;
        count += this.countKeys(obj[key], depth + 1);
      }
    }
    return count;
  }
};

window.Validator = {
  validate() {
    const results = [];
    const data = window.LevelParser.getData();
    if (!data) return results;
    
    const settings = data.Settings;
    if (!settings) {
      results.push({ level: 'error', message: 'Missing Settings section', path: 'Settings' });
      return results;
    }
    
    const leftTeams = settings.LeftTeams?.Array || [];
    const rightTeams = settings.RightTeams?.Array || [];
    if (leftTeams.length === 0) results.push({ level: 'error', message: 'No Left Teams defined', path: 'Settings.LeftTeams' });
    if (rightTeams.length === 0) results.push({ level: 'error', message: 'No Right Teams defined', path: 'Settings.RightTeams' });
    
    [...leftTeams, ...rightTeams].forEach((team, i) => {
      if (team.StatueHealth === 0) results.push({ level: 'warning', message: `Team "${team.TeamName}" has StatueHealth = 0`, path: `Team.${i}` });
    });
    
    const events = settings.Events?.Array || [];
    if (events.length === 0) {
      results.push({ level: 'info', message: 'Level has no Events', path: 'Settings.Events' });
    }
    
    const eventTimes = new Set();
    events.forEach((evt, i) => {
      const triggers = evt.Triggers?.Array || [];
      const actions = evt.Actions?.Array || [];
      
      if (triggers.length > 0 && actions.length === 0) {
        results.push({ level: 'warning', message: `Event ${i} has triggers but no actions`, path: `Events.${i}` });
      }
      if (actions.length > 0 && triggers.length === 0) {
        results.push({ level: 'warning', message: `Event ${i} has actions but no triggers`, path: `Events.${i}` });
      }

      triggers.forEach((t, j) => {
        if (t.EventTriggerType === 0 && t.TimeTrigger) {
          const rawTime = t.TimeTrigger.Time?.RawValue || 0;
          if (rawTime < 0) {
            results.push({ level: 'error', message: `Event ${i}, Trigger ${j}: Trigger time < 0`, path: `Events.${i}.Triggers.${j}` });
          } else {
            if (eventTimes.has(rawTime)) {
              results.push({ level: 'info', message: `Event ${i}: Duplicate event time ${rawTime}`, path: `Events.${i}.Triggers.${j}` });
            } else {
              eventTimes.add(rawTime);
            }
          }
        }
      });
      
      actions.forEach((act, j) => {
        if (act.ActionType === 0) { // SpawnUnits
          const units = act.SpawnUnits?.Units?.Array || [];
          if (units.length === 0) results.push({ level: 'warning', message: `Event ${i}, Action ${j}: SpawnUnits has no units`, path: `Events.${i}.Actions.${j}` });
          
          let spawnCount = 0;
          units.forEach((u, k) => {
            const val = u.AssetRefSlottableSpec?.Id?.Value;
            if (!val || val === 0) results.push({ level: 'error', message: `Event ${i}, Action ${j}, Unit ${k}: Unit reference ID = 0`, path: `Events.${i}.Actions.${j}.Units.${k}` });
            else if (window.MetadataDB.isLoaded() && !window.MetadataDB.resolve(val)) {
              results.push({ level: 'warning', message: `Event ${i}, Action ${j}, Unit ${k}: Unknown ID (not in metadata)`, path: `Events.${i}.Actions.${j}.Units.${k}` });
            }
            if ((u.Number || 0) <= 0) results.push({ level: 'warning', message: `Event ${i}, Action ${j}, Unit ${k}: Number field <= 0`, path: `Events.${i}.Actions.${j}.Units.${k}` });
            spawnCount += (u.Number || 0);
          });

          if (spawnCount > 50) {
            results.push({ level: 'info', message: `Event ${i}, Action ${j}: Spawn count > 50`, path: `Events.${i}.Actions.${j}` });
          }
          
          if (act.SpawnUnits.Side > 1) results.push({ level: 'warning', message: `Event ${i}, Action ${j}: Side > 1`, path: `Events.${i}.Actions.${j}` });
          
          const maxTeams = act.SpawnUnits.Side === 0 ? leftTeams.length : rightTeams.length;
          if (act.SpawnUnits.TeamIndex >= maxTeams) {
             results.push({ level: 'warning', message: `Event ${i}, Action ${j}: TeamIndex > actual team count`, path: `Events.${i}.Actions.${j}` });
          }
        }
      });
    });
    
    return results;
  }
};
